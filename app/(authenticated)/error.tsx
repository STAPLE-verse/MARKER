"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/**
 * Error boundary for the authenticated route group. Catches unexpected
 * exceptions thrown while rendering/loading any authenticated page (collection,
 * dashboard, profile, notifications) — the render/data-loading half of the
 * error strategy (see docs/architecture.md §8.9). It renders inside the
 * authenticated layout, so the navbar stays in place.
 */
export default function AuthenticatedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Server Component errors arrive with a generic message + digest; log the
    // digest so it can be matched against server-side logs.
    console.error("Authenticated route error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl flex flex-col items-center text-center animate-in fade-in duration-300">
      <div className="rounded-full bg-error/10 p-4 mb-6">
        <ExclamationTriangleIcon className="h-10 w-10 text-error" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-base-content/70 mb-6">
        We couldn&apos;t load this page. This is usually temporary &mdash; please try again.
      </p>

      {error.digest && (
        <Alert variant="error" className="mb-6 w-full" showIcon={false}>
          <span className="font-mono text-xs break-all">Reference: {error.digest}</span>
        </Alert>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/collection">
          <Button variant="ghost">Back to Collection</Button>
        </Link>
        <Button variant="primary" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
