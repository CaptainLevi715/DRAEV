"use client";

import Image from "next/image";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { CartIcon, HeartIcon, MenuIcon } from "./icons";

const NAV_LINKS = [
  { href: "#drop", label: "Drop 001" },
  { href: "#story", label: "Our Story" },
  { href: "#custom", label: "Custom Orders" },
];

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { wishlist, cartCount, openCart } = useStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg border-b border-line">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-[96px] flex items-center justify-between">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="md:hidden text-cream"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>

        <a href="#top" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Draev"
            width={200}
            height={80}
            className="h-16 md:h-20 w-auto object-contain"
            priority
          />
        </a>

        <nav className="hidden md:flex items-center gap-9 text-sm font-semibold text-cream/90">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-5">
          <button aria-label="Wishlist" className="hover:text-white transition-colors relative">
            <HeartIcon />
            {wishlist.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-cream text-bg text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.size}
              </span>
            )}
          </button>
          <button
            onClick={openCart}
            aria-label="Cart"
            className="hover:text-white transition-colors relative"
          >
            <CartIcon />
            <span className="absolute -top-2 -right-2 bg-cream text-bg text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <nav className="flex md:hidden flex-col gap-1 px-5 pb-4 text-sm font-semibold text-cream/90 border-t border-line">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2.5"
              onClick={() => setMobileNavOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
