import { NextRequest, NextResponse } from "next/server";
import type { ZodError, ZodSchema } from "zod";

// ---------------------------------------------------------------------------
// Client IP
// ---------------------------------------------------------------------------
// Netlify (and most edge proxies) set x-forwarded-for / x-nf-client-connection-ip.
// request.ip isn't populated in the Next.js Node runtime on Netlify, so we
// read the proxy headers directly. The first entry in x-forwarded-for is the
// original client; everything after it was appended by intermediate proxies.
export function clientIp(request: NextRequest): string {
  const nfIp = request.headers.get("x-nf-client-connection-ip");
  if (nfIp) return nfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// A fixed-window counter per (bucket, ip). This is in-memory, so it resets on
// cold start and is per-instance rather than globally coordinated — that's a
// real limitation of a serverless deployment without an external store like
// Redis, but it still meaningfully blocks the common cases (scripted abuse,
// brute-forced login, checkout spam from one machine) without adding another
// paid service to the stack. If this ever needs to be airtight across many
// concurrent instances, swap this for Upstash Redis or Netlify's own rate
// limiting (available on paid plans) — the call sites won't need to change.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prevent unbounded memory growth from many distinct IPs over a long-lived
// instance — sweep expired entries occasionally rather than on every call.
let lastSweep = Date.now();
function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-ish fixed-window limiter: `limit` requests per `windowMs` for a
 * given bucket key (e.g. `"login:" + ip`).
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests — please slow down and try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}

// ---------------------------------------------------------------------------
// Origin / CSRF protection
// ---------------------------------------------------------------------------
// The admin cookie is already SameSite=Lax, which stops it from being sent
// on cross-site POST/PATCH/DELETE requests in the first place — that alone
// blocks classic CSRF. This is a second, independent layer: any state-
// changing request must have an Origin (or Referer, as a fallback for older
// or unusual clients) whose host matches the host the request actually came
// in on. There's no hardcoded domain to configure — it works the same on a
// Netlify subdomain, a custom domain, or localhost during development.
export function hasSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Some non-browser or older clients omit Origin on same-origin requests;
  // fall back to Referer before rejecting outright.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // Neither header present. Browsers always send at least one of these on
  // fetch/XHR requests, so a same-origin browser request should never hit
  // this branch — treat the absence of both as suspicious and reject.
  return false;
}

export function originRejectedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Request rejected — invalid origin." },
    { status: 403 }
  );
}

// ---------------------------------------------------------------------------
// Body size guard
// ---------------------------------------------------------------------------
// Applied before JSON parsing so an attacker can't tie up the function
// parsing/validating a multi-megabyte body on a route that only ever needs a
// few hundred bytes (order details, a status string, etc). Image uploads
// have their own, much larger limit checked separately in that route.
const DEFAULT_MAX_BODY_BYTES = 32 * 1024; // 32KB — generous for any JSON payload this API accepts

export function bodyTooLargeResponse(): NextResponse {
  return NextResponse.json({ error: "Request body too large" }, { status: 413 });
}

// ---------------------------------------------------------------------------
// Safe JSON body parsing + zod validation
// ---------------------------------------------------------------------------
// Centralizes the three things every mutating route needs to do with its
// body: reject oversized payloads, reject malformed JSON, and validate shape
// with a zod schema — all with a consistent error response so the frontend
// always gets `{ error: string }` on failure, matching what it already
// expects everywhere.
export async function readValidatedJson<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<{ data: T } | { error: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return { error: bodyTooLargeResponse() };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { error: NextResponse.json({ error: "Couldn't read request body" }, { status: 400 }) };
  }

  if (raw.length > maxBytes) {
    return { error: bodyTooLargeResponse() };
  }

  let json: unknown;
  try {
    json = raw.length ? JSON.parse(raw) : {};
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: firstZodMessage(result.error) },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message || "Invalid request";
}
