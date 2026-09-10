"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useForkSchema } from "@/features/forms/hooks/useForkSchema";

interface ForkSchemaButtonProps {
  pid: string;
  isLoggedIn: boolean;
  viewerIsAuthor: boolean;
  viewerFormId: number | null;
  viewerVersionId: number | null;
}

/**
 * Three states, in priority order:
 * 1. Viewer authored this schema — forking your own work is pointless (you
 *    already have the source draft), so link to it instead. If it's gone
 *    (deleted draft, nulled FK), render nothing rather than a dead link.
 *    Links to the *specific* version this pid was published from
 *    (`?version=${viewerVersionId}`), not just the form — a family can have
 *    several published versions, each frozen from a different draft
 *    version, and `/collection/[formId]` alone always shows the latest.
 *    `/collection/[id]`'s own page redirects `?version=<latestId>` to the
 *    plain URL, so this doesn't need to special-case "is this the latest".
 * 2. Logged out — send them to log in and back (see utils/redirect.ts),
 *    not a click handler; they complete the fork by clicking again once
 *    they're back on this page.
 * 3. Logged in, not the author — the real fork action.
 */
export function ForkSchemaButton({
  pid,
  isLoggedIn,
  viewerIsAuthor,
  viewerFormId,
  viewerVersionId,
}: ForkSchemaButtonProps) {
  const { doFork, isForking } = useForkSchema();

  if (viewerIsAuthor) {
    if (viewerFormId === null || viewerVersionId === null) return null;
    return (
      <Link href={`/collection/${viewerFormId}?version=${viewerVersionId}`}>
        <Button variant="secondary" outline size="sm">
          View Your Draft
        </Button>
      </Link>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/schemas/${pid}`)}`}>
        <Button variant="primary" outline size="sm">
          Fork This Schema
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="primary" outline size="sm" disabled={isForking} onClick={() => doFork(pid)}>
      {isForking ? "Forking…" : "Fork This Schema"}
    </Button>
  );
}
