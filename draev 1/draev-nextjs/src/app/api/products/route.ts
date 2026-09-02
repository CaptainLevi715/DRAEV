import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listProducts, saveProduct } from "@/lib/store";
import {
  checkRateLimit,
  clientIp,
  hasSameOrigin,
  originRejectedResponse,
  rateLimitResponse,
  readValidatedJson,
} from "@/lib/security";
import { productCreateSchema } from "@/lib/validation";
import type { Product } from "@/lib/types";

// Public — the storefront needs this to render, so no auth check here.
// Light rate limiting only, to blunt naive scraping/DoS attempts without
// affecting normal shoppers.
const READ_LIMIT = 120;
const READ_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`products-read:${ip}`, READ_LIMIT, READ_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  const products = await listProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`products-write:${ip}`, 30, 60 * 1000);
  if (!limit.ok) return rateLimitResponse(limit);

  const parsed = await readValidatedJson(request, productCreateSchema, 8 * 1024);
  if ("error" in parsed) return parsed.error;
  const { name, colorway, img, imgBack, price, oldPrice, badge, desc } = parsed.data;

  // Timestamp + a short random suffix — unique enough for a single-owner
  // catalog without needing a counter or lookup, and still readable in
  // /admin (unlike a raw UUID).
  const id = `draev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const product: Product = {
    id,
    name,
    colorway,
    img,
    imgBack,
    price,
    oldPrice: oldPrice ?? price,
    badge: badge || "Hand-Painted",
    sold: false,
    desc: desc || "",
  };

  await saveProduct(product);
  return NextResponse.json({ product }, { status: 201 });
}
