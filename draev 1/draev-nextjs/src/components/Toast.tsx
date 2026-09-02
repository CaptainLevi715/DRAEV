"use client";

import { useStore } from "@/context/StoreContext";

export default function Toast() {
  const { toastMessage } = useStore();

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-cream text-bg text-sm font-bold px-5 py-3 z-[60] pointer-events-none transition-opacity duration-300 uppercase tracking-wide ${
        toastMessage ? "opacity-100" : "opacity-0"
      }`}
    >
      {toastMessage}
    </div>
  );
}
