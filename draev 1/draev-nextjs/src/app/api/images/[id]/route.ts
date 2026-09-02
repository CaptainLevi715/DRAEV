import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/store";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/security";
import { z } from "zod";

// Matches the id shape generated in the upload route
// (`${timestamp36}-${hex}`) — rejects path traversal or otherwise malformed
// keys before they ever reach the store lookup.
const imageIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/);

// A single product page can load several images at once, and this URL is
// also what next/image itself fetches (possibly more than once, at
// different sizes) — the limit here only needs to catch bulk
// scraping/abuse, not normal browsing.
const READ_LIMIT = 300;
const READ_WINDOW_MS = 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`images-read:${ip}`, READ_LIMIT, READ_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  const idResult = imageIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const image = await getImage(idResult.data);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
