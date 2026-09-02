"use client";

import { useStore, WHATSAPP_NUMBER, SHOP_EMAIL } from "@/context/StoreContext";
import { CloseIcon } from "./icons";

export default function ConfirmModal() {
  const { isConfirmOpen, closeConfirm, lastOrder, buildOrderMessage, sendChannels } =
    useStore();

  if (!isConfirmOpen || !lastOrder) return null;

  const msg = buildOrderMessage(lastOrder);

  return (
    <div className="checkout-modal fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/75" onClick={closeConfirm} />
      <div className="relative max-w-md mx-auto mt-24 bg-panel border border-line p-8 text-center">
        <button onClick={closeConfirm} className="absolute top-4 right-4">
          <CloseIcon />
        </button>
        <h3 className="font-display text-3xl uppercase mb-2">Order Placed</h3>
        <p className="font-bold mb-4">Order {lastOrder.orderId}</p>
        <p className="text-cream/80 text-sm mb-6">
          Your order is saved and we&rsquo;ll process it. Want us to see it
          faster? Send it directly below too.
        </p>
        <div className="flex flex-col gap-3">
          {sendChannels.whatsapp && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noopener"
              className="btn-solid transition-colors"
            >
              Send order via WhatsApp
            </a>
          )}
          {sendChannels.email && (
            <a
              href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(
                "Draev Order " + lastOrder.orderId
              )}&body=${encodeURIComponent(msg)}`}
              className="btn-outline transition-colors"
            >
              Send order via email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
