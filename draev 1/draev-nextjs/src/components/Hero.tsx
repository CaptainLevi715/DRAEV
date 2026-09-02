"use client";

import Image from "next/image";
import { useStore } from "@/context/StoreContext";

export default function Hero() {
  const { openCustomModal } = useStore();

  return (
    <section className="relative px-5 md:px-8 pt-14 md:pt-20 pb-16 max-w-7xl mx-auto overflow-hidden">
      <Image
        src="/images/logo.png"
        alt=""
        aria-hidden="true"
        width={623}
        height={525}
        className="pointer-events-none select-none absolute right-0 top-0 w-[380px] md:w-[520px] opacity-[0.18] mix-blend-screen"
      />
      <div className="relative">
        <div className="max-w-2xl">
          <h1 className="font-display text-[14vw] md:text-[4.6vw] leading-[0.95] uppercase tracking-tight">
            This was never
            <br />
            meant to hang
            <br />
            in a gallery.
          </h1>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#drop" className="btn-solid transition-colors">
              Shop Drop 001
            </a>
            <button onClick={openCustomModal} className="btn-outline transition-colors">
              Request custom piece
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
