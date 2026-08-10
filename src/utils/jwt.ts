import jwt from "jsonwebtoken";

import { ACCESS_JWT_SECRET } from "../config.ts";

// define how long access token should live
const ACCESS_TOKEN_EXPIRES_IN = "15min";

// Define exact shape of the data we store in side the access token
//
// userId: used to identify the authenticated user
// roles: used for authentication (e.g. admin checks)
//
// Important to remember: JWT payloads are NOT encrypted by default. They are ONLY signed.
// MEANING: Never, ever, ever, store sensitive data in here

export type AccessTokenPayload = {
  userId: string;
  roles: string[];
};

export function createAccessToken(payload: AccessTokenPayload): string {
  //1. takes the payload object
  //2. cryptographically sign the payload using the ACCESS_JWT_SECRET
  //3. embeds the expiration info (15 min)
  //4. return the JWT string

  return jwt.sign(payload, ACCESS_JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  //1. check if the token signature matches with the ACCESS_JWT_SECRET
  //2. check if the token is expired

  return jwt.verify(token, ACCESS_JWT_SECRET) as AccessTokenPayload;
}
