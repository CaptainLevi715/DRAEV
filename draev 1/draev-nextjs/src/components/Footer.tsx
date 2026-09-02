"use client";

import Image from "next/image";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { INSTAGRAM_PROFILE } from "@/lib/data";
import { MailIcon, WhatsappIcon } from "./icons";

export default function Footer() {
  const { openInfoModal } = useStore();
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-line px-5 md:px-8 pt-14 pb-8 mt-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <Image
            src="/images/logo.png"
            alt="Draev"
            width={200}
            height={80}
            className="h-20 w-auto object-contain mb-3"
          />
          <p className="text-cream/70 text-sm leading-relaxed">
            Underground hand-painted streetwear. No prints. No copies. No second
            chances.
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <a
              href="mailto:wear.draev@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:text-white"
            >
              <MailIcon />
              wear.draev@gmail.com
            </a>
            <a
              href="https://wa.me/923037630705"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:text-white"
            >
              <WhatsappIcon />
              +92 303 7630705
            </a>
          </div>
        </div>

        <div>
          <p className="font-bold uppercase text-sm mb-4">Support</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>
              <a
                href={INSTAGRAM_PROFILE}
                target="_blank"
                rel="noopener"
                className="hover:text-white"
              >
                DM for Support
              </a>
            </li>
            <li>
              <button
                onClick={() => openInfoModal("sizeGuide")}
                className="hover:text-white"
              >
                Size Guide
              </button>
            </li>
            <li>
              <button
                onClick={() => openInfoModal("shipping")}
                className="hover:text-white"
              >
                Shipping &amp; Returns
              </button>
            </li>
            <li>
              <a href="#custom" className="hover:text-white">
                Custom Orders
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold uppercase text-sm mb-4">Shop</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>
              <a href="#drop" className="hover:text-white">
                Drop 001
              </a>
            </li>
            <li>
              <a href="#story" className="hover:text-white">
                Our Story
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold uppercase text-sm mb-4">Secret Drop Alerts</p>
          <p className="text-cream/70 text-sm mb-3">
            Get first access before pieces hit the grid.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSubscribed(true);
              e.currentTarget.reset();
            }}
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50"
            />
            <button className="btn-solid transition-colors">Join</button>
          </form>
          {subscribed && (
            <p className="text-xs text-cream mt-2">You&rsquo;re in. Watch your inbox.</p>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-line mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-cream/60">
        <p>© 2026 Draev. Hand-painted in Lahore, Pakistan.</p>
        <p>Every piece is 1-of-1. What you see is the only one that will ever exist.</p>
      </div>
    </footer>
  );
}
