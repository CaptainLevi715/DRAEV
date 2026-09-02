import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sendOrderStatusEmail } from "@/lib/email";
import { getOrder, releaseProductReservation, reserveProductForOrder, saveOrder } from "@/lib/store";
import {
  checkRateLimit,
  clientIp,
  hasSameOrigin,
  originRejectedResponse,
  rateLimitResponse,
  readValidatedJson,
} from "@/lib/security";
import { orderIdSchema, orderStatusSchema } from "@/lib/validation";

const STATUS_LIMIT = 60;
const STATUS_WINDOW_MS = 60 * 1000; // generous — this is an admin-only route, just a sanity ceiling

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSameOrigin(request)) return originRejectedResponse();
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`order-status:${ip}`, STATUS_LIMIT, STATUS_WINDOW_MS);
  if (!limit.ok) return rateLimitResponse(limit);

  const idResult = orderIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const order = await getOrder(idResult.data);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = await readValidatedJson(request, orderStatusSchema);
  if ("error" in parsed) return parsed.error;

  // Reinstating a previously-cancelled order (cancelled → anything else):
  // cancelling already gave each item back to the public catalog, so by
  // now someone else may have legitimately bought it. Re-reserve every
  // item before allowing the un-cancel; if even one is no longer
  // available, refuse the status change instead of quietly reactivating
  // an order for a piece that now belongs to a different customer.
  if (order.status === "cancelled" && parsed.data.status !== "cancelled") {
    const reReserved: string[] = [];
    for (const item of order.items) {
      const result = await reserveProductForOrder(item.productId);
      if (result.ok) {
        reReserved.push(item.productId);
      } else {
        await Promise.all(reReserved.map((id) => releaseProductReservation(id)));
        const reason =
          result.reason === "not_found"
            ? `"${item.name}" no longer exists in the catalog`
            : `"${item.name}" was already sold to someone else after this order was cancelled`;
        return NextResponse.json(
          { error: `Can't reactivate this order — ${reason}.` },
          { status: 409 }
        );
      }
    }
  }

  const updated: typeof order = { ...order, status: parsed.data.status };

  try {
    await saveOrder(updated);
  } catch {
    // Roll back any re-reservation we just made above, so a failed save
    // doesn't leave items locked against an order that was never actually
    // updated.
    if (order.status === "cancelled" && parsed.data.status !== "cancelled") {
      await Promise.all(updated.items.map((item) => releaseProductReservation(item.productId)));
    }
    return NextResponse.json({ error: "Couldn't update order" }, { status: 500 });
  }

  // Cancelling an order must give each 1-of-1 piece it was holding back to
  // the public catalog — otherwise a cancelled order permanently "sells"
  // an item that was never actually delivered. Only fires on the
  // pending/confirmed/etc → cancelled transition, so re-saving an
  // already-cancelled order (or cancelling twice) can't double-release
  // anything, and releaseProductReservation itself is a no-op if the
  // product is already marked available.
  if (parsed.data.status === "cancelled" && order.status !== "cancelled") {
    await Promise.all(updated.items.map((item) => releaseProductReservation(item.productId)));
  }

  // Silently does nothing until RESEND_API_KEY is configured — see
  // src/lib/email.ts.
  await sendOrderStatusEmail(updated);

  return NextResponse.json({ order: updated });
}
