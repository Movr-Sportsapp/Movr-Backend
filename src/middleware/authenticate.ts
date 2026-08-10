import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";
import type { AccessTokenPayload } from "../utils/jwt.ts";
import { HttpError } from "../utils/httpError.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticate: RequestHandler = (req, res, next) => {
  //1. the access token lives in a httpOnly cookie
  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return next(new HttpError(401, "Not Authenticated"));
  }

  try {
    //2. throw error if verifyAccessToken has been tampered with or if its expired
    req.user = verifyAccessToken(accessToken);
    next();
  } catch (error: any) {
    //3. Expired is the special case. We set the WWW-Authenticate header so that the frontend knows it should try to call /auth/refresh before logging the user out
    if (error?.name === "TokenExpiredError") {
      res.setHeader("WWW-Authenticate", "token_expired");
      return next(new HttpError(401, "Access token expired"));
    }

    next(new HttpError(401, "Invalid token"));
  }
};
