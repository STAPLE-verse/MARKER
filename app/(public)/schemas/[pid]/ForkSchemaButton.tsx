"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useForkSchema } from "@/features/forms/hooks/useForkSchema";

interface ForkSchemaButtonProps {
  pid: string;
  isLoggedIn: boolean;
  viewerFormId: number | null;
  viewerVersionId: number | null;
}

/**
 * "View Your Draft" and "Fork This Schema" are independent now, not mutually
 * exclusive states — forking your own published schema is a legitimate
 * choice even with full draft access: cloning the draft (the existing
 * "Clone" action on `/collection/[id]`) makes an independent copy too, but
 * without provenance — no `forkedFromPid`, no "Forked" badge, no traceable
 * lineage back to *this* published version. Forking is the only way to get
 * that explicit lineage, so it stays available regardless of access
 * (`forkSchema.ts` no longer blocks the original author either).
 *
 * "View Your Draft" links to the *specific* version this pid was published
 * from (`?version=${viewerVersionId}`), not just the form — a family can
 * have several published versions, each frozen from a different draft
 * version, and `/collection/[formId]` alone always shows the latest.
 * `/collection/[id]`'s own page redirects `?version=<latestId>` to the plain
 * URL, so this doesn't need to special-case "is this the latest".
 */
export function ForkSchemaButton({ pid, isLoggedIn, viewerFormId, viewerVersionId }: ForkSchemaButtonProps) {
  const { doFork, isForking } = useForkSchema();
  const hasDraftAccess = viewerFormId !== null && viewerVersionId !== null;

  return (
    <>
      {hasDraftAccess && (
        <Link href={`/collection/${viewerFormId}?version=${viewerVersionId}`}>
          <Button variant="secondary" outline size="sm">
            View Your Draft
          </Button>
        </Link>
      )}
      {isLoggedIn ? (
        <Button variant="primary" outline size="sm" disabled={isForking} onClick={() => doFork(pid)}>
          {isForking ? "Forking…" : "Fork This Schema"}
        </Button>
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/schemas/${pid}`)}`}>
          <Button variant="primary" outline size="sm">
            Fork This Schema
          </Button>
        </Link>
      )}
    </>
  );
}
