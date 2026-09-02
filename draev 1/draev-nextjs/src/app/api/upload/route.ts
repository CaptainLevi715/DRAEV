import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/store";
import {
  checkRateLimit,
  clientIp,
  hasSameOrigin,
  originRejectedResponse,
  rateLimitResponse,
} from "@/lib/security";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// Only real raster image formats — deliberately not `image/*`. SVG in
// particular can contain inline <script> and is served back byte-for-byte
// at its own URL, so accepting it would let anyone with admin access (or
// anyone who compromises that session) store content capable of running
// script in this origin. Product photos never need to be SVG anyway.
const ALLOWED_TYPES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "image/gif": (b) =>
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
};

const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`upload:${ip}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
  }

  const sniff = ALLOWED_TYPES[file.type];
  if (!sniff) {
    return NextResponse.json(
      { error: "Unsupported image type — use JPEG, PNG, WebP, or GIF" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const header = new Uint8Array(bytes.slice(0, 16));

  // The browser-reported MIME type (file.type) is client-controlled and
  // easy to spoof, so it's only used to pick which signature to check —
  // the actual decision is whether the file's real header matches that
  // format. A renamed/relabeled non-image file fails here regardless of
  // what content-type it claims to be.
  if (!sniff(header)) {
    return NextResponse.json(
      { error: "File content doesn't match its declared image type" },
      { status: 400 }
    );
  }

  const id = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  await saveImage(id, bytes, file.type);

  return NextResponse.json({ url: `/api/images/${id}` }, { status: 201 });
}
