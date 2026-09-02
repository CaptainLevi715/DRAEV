"use client";

import { useStore } from "@/context/StoreContext";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const { products } = useStore();

  return (
    <section
      id="drop"
      className="px-5 md:px-8 py-16 md:py-20 max-w-7xl mx-auto border-t border-line"
    >
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <h2 className="font-display text-4xl md:text-5xl uppercase">Wearable Originals</h2>
        <p className="text-cream/70 text-base md:text-lg max-w-xs">
          50% off launch pricing. Once a piece sells, it never comes back.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
