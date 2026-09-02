"use client";

import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { formatRs } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const { openQuickView } = useStore();

  return (
    <div className={`paper-card group flex flex-col${product.sold ? " sold-out" : ""}`}>
      <div
        className={`zoom-wrap relative aspect-[3/4] ${product.sold ? "" : "cursor-pointer"}`}
        onClick={() => !product.sold && openQuickView(product.id)}
      >
        <span className="absolute top-3 left-3 z-10 bg-cream text-bg text-xs font-bold px-2.5 py-1 uppercase">
          {product.sold ? "Sold Out" : product.badge}
        </span>
        <Image
          src={product.img}
          alt={product.name}
          width={960}
          height={1280}
          quality={90}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={`w-full h-full object-cover${
            product.imgBack ? " transition-opacity duration-300 group-hover:opacity-0" : ""
          }`}
        />
        {product.imgBack && (
          <Image
            src={product.imgBack}
            alt={`${product.name} back`}
            width={960}
            height={1280}
            quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="font-bold text-base">{product.name}</p>
        <p className="text-cream/70 text-sm mt-0.5">{product.colorway}</p>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-extrabold text-lg">{formatRs(product.price)}</span>
        </div>
        <button
          disabled={product.sold}
          onClick={() => !product.sold && openQuickView(product.id)}
          className={`${
            product.sold ? "btn-outline opacity-50 cursor-not-allowed" : "btn-outline"
          } mt-4 w-full transition-colors`}
        >
          {product.sold ? "Sold out" : "View & select size"}
        </button>
      </div>
    </div>
  );
}
