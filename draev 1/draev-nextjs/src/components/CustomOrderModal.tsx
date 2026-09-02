"use client";

import { useStore, WHATSAPP_NUMBER } from "@/context/StoreContext";
import { TIKTOK_PROFILE } from "@/lib/data";
import { CloseIcon } from "./icons";

export default function CustomOrderModal() {
  const { isCustomModalOpen, closeCustomModal } = useStore();

  if (!isCustomModalOpen) return null;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi Draev, I want a custom piece."
  )}`;

  return (
    <div className="checkout-modal fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={closeCustomModal} />
      <div className="relative max-w-sm mx-auto mt-28 bg-panel border border-line p-8 text-center">
        <button onClick={closeCustomModal} className="absolute top-4 right-4">
          <CloseIcon />
        </button>
        <h3 className="font-display text-2xl uppercase mb-2">Custom piece</h3>
        <p className="text-cream/80 text-sm mb-6">
          Reach out directly — Draev will talk sizing, artwork, and price with you
          before anything&rsquo;s painted.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="https://ig.me/m/wear.draev"
            target="_blank"
            rel="noopener"
            className="btn-solid transition-colors"
          >
            Message on Instagram
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            className="btn-outline transition-colors"
          >
            Message on WhatsApp
          </a>
          <a
            href={TIKTOK_PROFILE}
            target="_blank"
            rel="noopener"
            className="btn-outline transition-colors"
          >
            Message on TikTok
          </a>
        </div>
      </div>
    </div>
  );
}
