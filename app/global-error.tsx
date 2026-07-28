"use client";

import "./globals.css";
import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";

/**
 * Catastrophic fallback for failures in the root layout itself (which the
 * route-group `error.tsx` boundaries cannot catch). It replaces the root layout,
 * so it must render its own <html>/<body> and import global styles. The toast
 * Toaster is intentionally absent here — this is the last line of defense.
 * See docs/architecture.md §8.9.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen flex items-center justify-center antialiased bg-base-100 text-base-content">
        <div className="flex flex-col items-center text-center px-4 max-w-md">
          <div className="rounded-full bg-error/10 p-4 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-error" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-base-content/70 mb-6">
            A critical error occurred and the app couldn&apos;t recover. Please try again.
          </p>

          {error.digest && (
            <p className="font-mono text-xs text-base-content/50 break-all mb-6">
              Reference: {error.digest}
            </p>
          )}

          <Button variant="primary" onClick={() => unstable_retry()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
