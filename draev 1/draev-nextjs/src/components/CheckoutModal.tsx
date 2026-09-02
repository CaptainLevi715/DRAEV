"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { formatRs } from "@/lib/format";
import { CloseIcon } from "./icons";

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    cartSubtotal,
    submitCheckout,
    isSubmittingOrder,
  } = useStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  if (!isCheckoutOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submitCheckout({ name, phone, address, email });
    if (ok) {
      setName("");
      setPhone("");
      setAddress("");
      setEmail("");
    }
  }

  return (
    <div className="checkout-modal fixed inset-0 z-[55]">
      <div className="absolute inset-0 bg-black/75" onClick={closeCheckout} />
      <div className="relative max-w-lg mx-auto mt-10 mb-10 bg-panel border border-line max-h-[88dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 h-[70px] border-b border-line sticky top-0 bg-panel">
          <h3 className="font-display text-2xl uppercase">Checkout</h3>
          <button onClick={closeCheckout}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <p className="text-sm font-bold uppercase mb-2">Contact &amp; Shipping</p>
          <div className="space-y-3 mb-6">
            <input
              required
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50"
            />
            <input
              required
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50"
            />
            <textarea
              required
              placeholder="Delivery address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50"
            />
            <input
              type="email"
              placeholder="Email (optional — for order updates)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50"
            />
          </div>

          <p className="text-sm font-bold uppercase mb-2">Payment Method</p>
          <div className="text-cream/80 text-sm mb-6 border border-line px-3 py-2.5">
            Cash on delivery. Pay in cash when your order arrives — no advance
            payment needed.
          </div>

          <div className="border-t border-line mt-4 pt-4 flex justify-between text-sm text-cream/80 mb-5">
            <span>Total</span>
            <span className="font-bold text-cream">{formatRs(cartSubtotal)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmittingOrder}
            className="btn-solid w-full transition-colors disabled:opacity-60"
          >
            {isSubmittingOrder ? "Placing order…" : "Place order"}
          </button>
        </form>
      </div>
    </div>
  );
}
