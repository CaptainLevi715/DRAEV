import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteProduct, getProduct, saveProduct } from "@/lib/store";
import {
  checkRateLimit,
  clientIp,
  hasSameOrigin,
  originRejectedResponse,
  rateLimitResponse,
  readValidatedJson,
} from "@/lib/security";
import { productIdSchema, productUpdateSchema } from "@/lib/validation";

const WRITE_LIMIT = 30;
const WRITE_WINDOW_MS = 60 * 1000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`products-write:${ip}`, WRITE_LIMIT, WRITE_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  const idResult = productIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await getProduct(idResult.data);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // `.strict()` in productUpdateSchema means any field not on the known
  // allow-list (name/colorway/img/imgBack/price/oldPrice/badge/desc/sold)
  // is rejected outright rather than silently merged into the stored
  // record — the previous version spread the raw request body straight
  // onto the product, so a request with an unexpected extra key would have
  // been written to the database as-is.
  const parsed = await readValidatedJson(request, productUpdateSchema, 8 * 1024);
  if ("error" in parsed) return parsed.error;

  const updated = { ...existing, ...parsed.data, id: existing.id };
  await saveProduct(updated);
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`products-write:${ip}`, WRITE_LIMIT, WRITE_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  const idResult = productIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteProduct(idResult.data);
  return NextResponse.json({ ok: true });
}
