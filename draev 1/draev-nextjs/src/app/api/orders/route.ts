import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  createOrder,
  generateOrderId,
  getProduct,
  listOrders,
  releaseProductReservation,
  reserveProductForOrder,
} from "@/lib/store";
import { sendOrderStatusEmail } from "@/lib/email";
import {
  hasSameOrigin,
  originRejectedResponse,
  readValidatedJson,
} from "@/lib/security";
import { orderSchema } from "@/lib/validation";
import type { Order, OrderItemLine } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

// Real customers placing real orders, so this is the single most
// important route in the whole backend to get right: never trust a price
// from the client (there isn't one sent here, and that's on purpose — every
// price is re-read from the database), never let two people buy the same
// 1-of-1 piece, and never lose track of a reservation if something fails
// partway through.
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return originRejectedResponse();

  const parsed = await readValidatedJson(request, orderSchema, 16 * 1024);
  if ("error" in parsed) return parsed.error;
  const { name, phone, address, email, cart } = parsed.data;

  // Collapse duplicate lines for the same product (e.g. a double-submitted
  // click, or a hand-crafted request) into one — there is only ever one
  // physical unit of a given product, so it can only ever appear once in a
  // real order regardless of how many lines the client sent.
  const uniqueProductIds = Array.from(new Set(cart.map((line) => line.id)));
  const sizeByProduct = new Map(cart.map((line) => [line.id, line.size]));

  // --- Phase 1: reserve every item atomically -----------------------------
  // Each reservation is an independent compare-and-swap against that
  // product's current state, so this can't oversell even if two customers
  // submit overlapping carts at the exact same time. If anything in this
  // cart is unavailable, every reservation already taken in this loop is
  // rolled back before responding — the customer never ends up holding a
  // partial order's worth of inventory.
  const reserved: string[] = [];
  let unavailable: string | null = null;

  for (const productId of uniqueProductIds) {
    const result = await reserveProductForOrder(productId);
    if (result.ok) {
      reserved.push(productId);
    } else {
      unavailable = productId;
      break;
    }
  }

  if (unavailable) {
    await Promise.all(reserved.map((id) => releaseProductReservation(id)));
    return NextResponse.json(
      { error: "One or more items in your cart just sold out — please review your cart." },
      { status: 409 }
    );
  }

  // --- Phase 2: build the order from server-side product data -------------
  // Every price/name/colorway comes from the database record we just
  // reserved, never from the request body — the request only supplies
  // *which* products and sizes, nothing about their price.
  let subtotal = 0;
  const items: OrderItemLine[] = [];

  for (const productId of reserved) {
    const product = await getProduct(productId);
    if (!product) continue; // reserved it, but it vanished — shouldn't happen, defensive only
    // Every product is a hand-painted 1-of-1 piece: whatever quantity the
    // client asked for, exactly one unit exists and exactly one is being
    // sold. Charging price × qty for a single physical item would be a
    // billing bug, not a feature.
    const lineTotal = product.price;
    subtotal += lineTotal;
    items.push({
      productId: product.id,
      name: product.name,
      colorway: product.colorway,
      size: sizeByProduct.get(productId) ?? "",
      qty: 1,
      lineTotal,
    });
  }

  if (items.length === 0) {
    await Promise.all(reserved.map((id) => releaseProductReservation(id)));
    return NextResponse.json({ error: "Cart items not found" }, { status: 400 });
  }

  const order: Order = {
    orderId: generateOrderId(),
    name,
    phone,
    address,
    email,
    payMethod: "cod",
    items,
    subtotal,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await createOrder(order);
    if (!created) throw new Error("ORDER_ID_COLLISION");
  } catch {
    await Promise.all(reserved.map((id) => releaseProductReservation(id)));
    return NextResponse.json({ error: "Couldn't place order — please try again" }, { status: 500 });
  }

  // Best-effort order-received email — never blocks or fails the order
  // itself, and quietly does nothing until RESEND_API_KEY is configured
  // (see src/lib/email.ts).
  await sendOrderStatusEmail(order);

  return NextResponse.json({ order }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
