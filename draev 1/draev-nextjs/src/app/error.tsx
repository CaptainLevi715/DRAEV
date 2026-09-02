"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-bgDeep text-cream font-sans">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-3">
            Something went wrong
          </h1>
          <p className="text-cream/70 text-sm max-w-sm mb-6">
            That page hit a snag on our end. Try again, or head back to the
            storefront.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="border border-cream px-5 py-2.5 text-sm font-semibold hover:bg-cream hover:text-bgDeep transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="border border-cream/40 px-5 py-2.5 text-sm font-semibold hover:border-cream transition-colors"
            >
              Back to storefront
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
