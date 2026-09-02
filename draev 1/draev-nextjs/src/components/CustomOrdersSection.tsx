"use client";

import { useStore } from "@/context/StoreContext";

export default function CustomOrdersSection() {
  const { openCustomModal } = useStore();

  return (
    <section
      id="custom"
      className="px-5 md:px-8 py-20 md:py-24 max-w-7xl mx-auto text-center border-t border-line"
    >
      <h2 className="font-display text-4xl md:text-5xl uppercase">
        Want one made for you?
      </h2>
      <p className="text-cream/80 mt-4 max-w-xl mx-auto">
        Send your idea, size, and budget. Custom pieces are painted to order and take
        7–14 days — no two ever come out the same.
      </p>
      <button
        onClick={openCustomModal}
        className="btn-solid inline-block mt-8 transition-colors"
      >
        Request a custom piece
      </button>
    </section>
  );
}
