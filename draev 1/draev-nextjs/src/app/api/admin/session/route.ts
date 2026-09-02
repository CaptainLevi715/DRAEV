import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/security";

// Read-only and cheap (just a cookie hash comparison), but still worth a
// generous ceiling — this is called once on every /admin page load, never
// in a loop by normal usage, so a low-effort limit here can't affect a
// real admin while still blunting scripted hammering of the endpoint.
const SESSION_LIMIT = 60;
const SESSION_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`session:${ip}`, SESSION_LIMIT, SESSION_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  return NextResponse.json({ loggedIn: await isAdmin() });
}
