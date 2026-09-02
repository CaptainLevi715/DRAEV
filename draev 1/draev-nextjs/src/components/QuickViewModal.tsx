"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { SIZES, UNAVAILABLE_SIZES } from "@/lib/data";
import { formatRs } from "@/lib/format";
import { CloseIcon, HeartIcon } from "./icons";

export default function QuickViewModal() {
  const {
    quickViewProduct,
    quickViewSize,
    quickViewQty,
    closeQuickView,
    selectQuickViewSize,
    incrementQuickViewQty,
    decrementQuickViewQty,
    confirmAddFromQuickView,
    toggleWishlist,
  } = useStore();

  const [activeImg, setActiveImg] = useState<"front" | "back">("front");

  const isOpen = !!quickViewProduct;

  useEffect(() => {
    setActiveImg("front");
  }, [quickViewProduct?.id]);

  if (!isOpen || !quickViewProduct) return null;

  const showBackToggle = !!quickViewProduct.imgBack;
  const displayedImg =
    showBackToggle && activeImg === "back" ? quickViewProduct.imgBack! : quickViewProduct.img;

  return (
    <div className="quickview fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={closeQuickView} />
      <div className="relative flex flex-col md:grid md:grid-cols-2 mx-3 sm:mx-auto sm:max-w-4xl mt-6 md:mt-16 mb-6 md:mb-10 bg-panel border border-line max-h-[92dvh] md:max-h-[85dvh] overflow-y-auto overscroll-contain">
        <button
          onClick={closeQuickView}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="zoom-wrap bg-black/20 relative w-full shrink-0 h-[46vh] min-h-[280px] sm:h-[50vh] md:h-auto md:aspect-auto">
          <Image
            src={displayedImg}
            alt={quickViewProduct.name}
            width={960}
            height={1280}
            quality={90}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="w-full h-full object-cover"
          />
          {showBackToggle && (
            <div className="absolute bottom-3 left-3 flex gap-2 z-10">
              <button
                onClick={() => setActiveImg("front")}
                className={`text-xs font-bold uppercase px-2.5 py-1 transition-colors ${
                  activeImg === "front" ? "bg-cream text-bg" : "bg-black/50 text-cream hover:bg-black/70"
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setActiveImg("back")}
                className={`text-xs font-bold uppercase px-2.5 py-1 transition-colors ${
                  activeImg === "back" ? "bg-cream text-bg" : "bg-black/50 text-cream hover:bg-black/70"
                }`}
              >
                Back
              </button>
            </div>
          )}
        </div>
        <div className="p-5 sm:p-6 md:p-8 pb-8">
          <span className="inline-block bg-cream text-bg text-xs font-bold px-2.5 py-1 uppercase mb-3">
            {quickViewProduct.badge}
          </span>
          <h3 className="font-display text-2xl sm:text-3xl uppercase leading-tight">
            {quickViewProduct.name}
          </h3>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-2xl font-extrabold">{formatRs(quickViewProduct.price)}</span>
          </div>
          <p className="text-cream/80 text-sm mt-4 leading-relaxed">
            {quickViewProduct.desc}
          </p>

          <div className="mt-6">
            <p className="text-sm font-bold uppercase mb-2">Size</p>
            <div className="flex gap-2 items-center flex-wrap">
              {SIZES.map((size) => {
                const unavailable = (UNAVAILABLE_SIZES as readonly string[]).includes(size);
                const selected = quickViewSize === size;
                if (unavailable) {
                  return (
                    <button
                      key={size}
                      disabled
                      className="w-11 h-11 text-sm font-bold border border-line text-cream/40 relative cursor-not-allowed"
                    >
                      <span className="relative">
                        {size}
                        <span className="absolute left-0 right-0 top-1/2 h-px bg-cream/40" />
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={size}
                    onClick={() => selectQuickViewSize(size)}
                    className={`${
                      selected ? "btn-solid" : "btn-outline"
                    } w-11 h-11 text-sm font-bold transition-colors`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <p className="text-cream/60 text-sm mt-2">Only S and M in stock right now.</p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold uppercase mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuickViewQty}
                disabled={quickViewQty <= 1}
                aria-label="Decrease quantity"
                className="btn-outline w-11 h-11 p-0 flex items-center justify-center text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-bold tabular-nums">
                {quickViewQty}
              </span>
              <button
                onClick={incrementQuickViewQty}
                disabled={quickViewQty >= 10}
                aria-label="Increase quantity"
                className="btn-outline w-11 h-11 p-0 flex items-center justify-center text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <button onClick={confirmAddFromQuickView} className="btn-solid flex-1 min-w-[140px] transition-colors">
              Add to cart
            </button>
            <button
              onClick={() => toggleWishlist(quickViewProduct.id)}
              className="btn-outline w-12 h-12 shrink-0 p-0 flex items-center justify-center transition-colors"
            >
              <HeartIcon width={19} height={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
