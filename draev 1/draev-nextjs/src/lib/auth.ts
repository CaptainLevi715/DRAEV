import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "draev_admin";

// No user accounts, no sessions database: the cookie's value is a hash of
// your admin password plus a fixed salt. It can only be produced by someone
// who already knows the password, and we recompute + compare it on every
// admin request. Simple on purpose — this protects a single owner login,
// not a multi-user system.
function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`draev:${password}`).digest("hex");
}

// Constant-time comparison so a network attacker measuring response times
// can't incrementally guess the password one character at a time. Both
// sides are hashed to a fixed-length digest first so the comparison itself
// never leaks the length of the entered password either.
function safeEqual(a: string, b: string): boolean {
  const bufA = createHash("sha256").update(a).digest();
  const bufB = createHash("sha256").update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  return safeEqual(password, expected);
}

export async function createAdminSession(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return true;
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const store = await cookies();
  const cookieValue = store.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;
  return safeEqual(cookieValue, token);
}
