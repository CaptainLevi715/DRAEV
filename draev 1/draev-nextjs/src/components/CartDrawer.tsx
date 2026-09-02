"use client";

import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { formatRs } from "@/lib/format";
import { CloseIcon } from "./icons";

export default function CartDrawer() {
  const { cart, products, isCartOpen, closeCart, removeFromCart, cartSubtotal, openCheckout } =
    useStore();

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={closeCart} />
      )}
      <aside
        className={`cart-drawer ${
          isCartOpen ? "" : "closed"
        } fixed top-0 right-0 h-full w-full sm:w-[420px] bg-panel border-l border-line z-50 flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 h-[76px] border-b border-line">
          <h3 className="font-display text-2xl uppercase">Your Cart</h3>
          <button onClick={closeCart} aria-label="Close cart">
            <CloseIcon size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-cream/70">Your cart is empty.</p>
            <a
              href="#drop"
              onClick={closeCart}
              className="mt-4 font-semibold text-sm underline underline-offset-4"
            >
              Shop Drop 001
            </a>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {cart.map((item, idx) => {
              const p = products.find((pp) => pp.id === item.id);
              if (!p) return null;
              return (
                <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4">
                  <Image
                    src={p.img}
                    alt={p.name}
                    width={80}
                    height={96}
                    className="w-20 h-24 object-cover border border-line"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-cream/70 text-sm mt-0.5">
                      Size {item.size} · Qty {item.qty}
                    </p>
                    <p className="font-bold text-sm mt-1">{formatRs(p.price * item.qty)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-cream/70 hover:text-white self-start"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-line px-6 py-6">
          <div className="flex justify-between text-sm text-cream/80 mb-4">
            <span>Subtotal</span>
            <span>{formatRs(cartSubtotal)}</span>
          </div>
          <button onClick={openCheckout} className="btn-solid w-full transition-colors">
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
