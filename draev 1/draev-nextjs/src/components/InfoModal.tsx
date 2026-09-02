"use client";

import { useStore } from "@/context/StoreContext";
import { INFO_CONTENT } from "@/lib/data";
import { CloseIcon } from "./icons";

export default function InfoModal() {
  const { infoModalKey, closeInfoModal } = useStore();

  if (!infoModalKey) return null;
  const info = INFO_CONTENT[infoModalKey];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={closeInfoModal} />
      <div className="relative max-w-lg mx-auto mt-24 bg-panel border border-line p-8">
        <button onClick={closeInfoModal} className="absolute top-4 right-4">
          <CloseIcon />
        </button>
        <h3 className="font-display text-2xl uppercase mb-4">{info.title}</h3>
        <div className="text-cream/80 text-sm leading-relaxed space-y-3">
          {info.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
