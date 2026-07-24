import { SignJWT, jwtVerify } from "jose";

// Design decision: JWT in an httpOnly cookie rather than a DB-backed
// session table. For a single-admin tool like this, it avoids an extra
// model/query on every request while still being revocable by rotating
// AUTH_SECRET. Uses `jose` (not jsonwebtoken) because it runs on the Edge
// runtime, so the same code works in middleware.ts without a Node build.

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-fallback-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "leaddesk_session";
const SESSION_DURATION = "8h";

export type SessionPayload = {
  sub: string; // admin user id
  email: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    // Expired, tampered, or malformed — treat as unauthenticated.
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours, matches SESSION_DURATION
