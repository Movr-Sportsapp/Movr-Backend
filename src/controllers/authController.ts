import z from "zod";
import type { loginSchema, registerSchema } from "../schemas/auth.ts";
import { isProduction, REFRESH_TOKEN_TTL, SALT_ROUNDS } from "../config.ts";
import type { Types } from "mongoose";
import { generateRefreshTokenString, hashToken } from "../utils/token.ts";
import RefreshToken from "../models/RefreshToken.ts";
import type { RequestHandler } from "express";
import User from "../models/User.ts";
import { HttpError } from "../utils/httpError.ts";
import bcrypt from "bcrypt";
import { createAccessToken } from "../utils/jwt.ts";

//-------------------------------
// TYPES
//-------------------------------
type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

//-------------------------------
// COOKIE CONFIGURATION
//-------------------------------
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true, // !!CRITICAL!! (Stops XSS attacks)
  sameSite: isProduction ? ("none" as const) : ("lax" as const), // stops CSRF attacks
  secure: isProduction,
  maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  secure: isProduction,
  path: "/auth/refresh",
  maxAge: REFRESH_TOKEN_TTL * 1000,
};

//-------------------------------
// SESSION HELPERS
//-------------------------------
const MAX_SESSIONS_PER_USER = 5;

// Create a refresh token for the user:
// it generates the random string, store ONLY its hash in the DB,
// returns the raw string that is then stored in the cookies

async function issueRefreshToken(userId: Types.ObjectId): Promise<string> {
  const refreshTokenString = generateRefreshTokenString();
  await RefreshToken.create({
    tokenHash: hashToken(refreshTokenString),
    userId,
  });
  return refreshTokenString;
}

// cap the users to only be able to have the 5 newest sessions running
async function enforceSessionLimit(userId: Types.ObjectId): Promise<void> {
  const excess = await RefreshToken.find({ userId, revokedAt: null })
    .sort({ createdAt: -1 }) // newest first
    .skip(MAX_SESSIONS_PER_USER)
    .select("_id")
    .lean();

  if (excess.length > 0) {
    await RefreshToken.deleteMany({ _id: { $in: excess.map((t) => t._id) } });
  }
}

// ==============================
//  REGISTER CONTROLLER
// ==============================
export const register: RequestHandler = async (req, res, next) => {
  try {
    //1. extract the data from the request body
    const { password, ...rest } = req.body as Omit<
      RegisterBody,
      "confirmPassword"
    >;

    //2. friendly checks
    const existing = await User.findOne({
      $or: [{ email: rest.email }, { username: rest.username }],
    }).lean();
    if (existing) {
      throw new HttpError(409, "Email already in use");
    }
    //3. hash the password. NEVER EVER store it as plain text
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    //4. create the new user in the DB
    const newUser = await User.create({
      ...rest,
      passwordHash: hashedPassword,
      roles: ["user"],
    });

    //5. Generate the 2 tokens

    // Access token is a signed JWT containing the user's ID and role
    const accessToken = createAccessToken({
      userId: newUser._id.toString(),
      roles: newUser.roles,
    });

    // Refresh token: random string in the cookie, hash in the DB
    const refreshTokenString = await issueRefreshToken(newUser._id);

    //6. attach the tokens to the response as HTTP-only cookies
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshTokenString, REFRESH_COOKIE_OPTIONS);

    // 7. send a success response
    res.status(201).json({
      message: "User registered",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roles: newUser.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
//  LOGIN CONTROLLER
// ==============================
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { identifier, password } = req.body as LoginBody;

    //1. find the user by email
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+passwordHash +refreshTokens");

    // give a generic "incorrect credentials" for either wrong email or wrong pass
    if (!user) {
      throw new HttpError(401, "Incorrect credentials");
    }

    //2. Compare plain text password from the request with the hashed pass in the DB
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Incorrect credentials");
    }

    //3. generate the new tokens(refresh token hash goes into the DB)
    const accessToken = createAccessToken({
      userId: user._id.toString(),
      roles: user.roles,
    });

    const refreshTokenString = await issueRefreshToken(user._id);

    //4. housekeeping: cap the number of concurrent sessions
    await enforceSessionLimit(user._id);

    //5. tokens go into the cookies
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshTokenString, REFRESH_COOKIE_OPTIONS);

    //6. respond with user data
    res.status(200).json({
      message: "Logged in",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
//  REFRESH CONTROLLER
// ==============================
export const refresh: RequestHandler = async (req, res, next) => {
  try {
    //1. extract refresh token coming from cookies
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      throw new HttpError(401, "No refresh token provided");
    }

    //2. hash the incoming token and look up the hash
    const existing = await RefreshToken.findOne({
      tokenHash: hashToken(oldRefreshToken),
    });

    if (!existing) {
      // it's either garbage or the TTL index already deleted it
      throw new HttpError(401, "Invalid refresh token");
    }

    //3. REUSE DETECTION!! If this token exists but was already rotated, that means someone is likely replaying an old token.
    // We don't know if it's the legitimate user or a thief holding the token, so we just kill all sessions.
    console.log(existing);
    if (existing.revokedAt) {
      await RefreshToken.deleteMany({ userId: existing.userId });
      res.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      throw new HttpError(401, "Session revoked. Please log in again");
    }

    //4. Explicit expiration check
    if (existing.expireAt && existing.expireAt.getTime() <= Date.now()) {
      await RefreshToken.deleteOne({ _id: existing._id });
      throw new HttpError(401, "Refresh token expired");
    }

    //5. find user associated to token
    const user = await User.findById(existing.userId);
    if (!user) {
      throw new HttpError(401, "Invalid session");
    }

    //6. TOKEN ROTATION. Mark the old token as revoked instead of deleting it.
    // Keeping the revoked record around is what makes it possible to do the re-use detection we did in step 3
    existing.revokedAt = new Date();
    await existing.save();

    //7. issue a brand new pair of tokens
    const newAccessToken = createAccessToken({
      userId: user._id.toString(),
      roles: user.roles,
    });
    const newRefreshToken = await issueRefreshToken(user._id);

    //8. send thr cookies back to the browser
    res.cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({ message: "Tokens refreshed" });
  } catch (error) {
    next(error);
  }
};

// ==============================
//  LOGOUT CONTROLLER
// ==============================
export const logout: RequestHandler = async (req, res, next) => {
  try {
    //1. grab refresh token from cookie
    const refreshTokenCookie = req.cookies?.refreshToken;

    //2. if it exists, delete its hash from the db
    if (refreshTokenCookie) {
      await RefreshToken.deleteOne({
        tokenHash: hashToken(refreshTokenCookie),
      });
    }

    //3. tell browser to clear cookies
    res.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

    //4. send a 200 with a confirmation message
    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    next(error);
  }
};
