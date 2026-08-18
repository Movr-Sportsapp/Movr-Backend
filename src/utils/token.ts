import { createHash, randomUUID } from "node:crypto";

export function generateRefreshTokenString(): string {
  return randomUUID();
}

//SHA-256 hash of a token, hex code
// The client always holds the raw token (in the cookie);
// the database only ever sees this hash
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
