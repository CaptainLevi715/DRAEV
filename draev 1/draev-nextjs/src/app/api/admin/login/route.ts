import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createAdminSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import {
  checkRateLimit,
  clientIp,
  hasSameOrigin,
  originRejectedResponse,
  rateLimitResponse,
  readValidatedJson,
} from "@/lib/security";

// Deliberately strict: this is the one endpoint protecting the entire admin
// dashboard, so brute-forcing it is the highest-value attack against this
// site. 8 attempts per 15 minutes per IP makes online guessing impractical
// without meaningfully inconveniencing the real owner, who only needs this
// a handful of times a day.
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return originRejectedResponse();

  const ip = clientIp(request);
  const limit = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "No ADMIN_PASSWORD is set on this deployment yet. Set it in Netlify: Site settings → Environment variables.",
      },
      { status: 500 }
    );
  }

  const result = await readValidatedJson(request, loginSchema);
  if ("error" in result) return result.error;

  if (!checkPassword(result.data.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
