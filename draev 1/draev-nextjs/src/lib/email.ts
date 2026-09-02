import type { Order } from "./types";

// Auto-emailing customers requires an external email service — Netlify
// itself cannot send email. This uses Resend (resend.com) because it has a
// genuinely free tier (100 emails/day, no card required). If you haven't
// signed up yet, RESEND_API_KEY simply won't exist and this quietly does
// nothing — the rest of the site works fine without it.
export async function sendOrderStatusEmail(order: Order): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail || !order.email) return;

  const statusLabel: Record<Order["status"], string> = {
    pending: "Order received",
    confirmed: "Order confirmed",
    shipped: "Your order has shipped",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  };

  const itemLines = order.items
    .map((i) => `- ${i.name} (${i.colorway}) — Size ${i.size} x${i.qty}`)
    .join("\n");

  const body = [
    `Hi ${order.name},`,
    "",
    `Update on your Draev order ${order.orderId}: ${statusLabel[order.status]}.`,
    "",
    itemLines,
    "",
    `Total (Cash on Delivery): Rs ${order.subtotal.toLocaleString()}`,
  ].join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: order.email,
        subject: `Draev — ${statusLabel[order.status]} (${order.orderId})`,
        text: body,
      }),
    });
  } catch {
    // Never let an email failure break an order status update.
  }
}
