"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CollapsibleHistorySidebar } from "@/components/ui/CollapsibleHistorySidebar";
import { PublishedSchemaVersionDTO } from "@/features/forms/types";

interface PublishedVersionsSidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  versions: PublishedSchemaVersionDTO[];
  currentPid: string;
}

/**
 * Public, read-only counterpart to `/collection/[id]`'s
 * `VersionHistorySidebar` — shares the collapsible shell via
 * `CollapsibleHistorySidebar`, but for `/schemas/[pid]`'s catalog visitors:
 * no delete/new-version controls (every row here is an immutable,
 * already-published `PublishedSchema`), just links across sibling versions
 * in the family.
 */
export function PublishedVersionsSidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  versions,
  currentPid,
}: PublishedVersionsSidebarProps) {
  return (
    <CollapsibleHistorySidebar
      isOpen={isHistoryOpen}
      setIsOpen={setIsHistoryOpen}
      versionCount={versions.length}
    >
      {versions.map((version, index) => {
        const isLatest = index === 0;
        const isSelected = version.pid === currentPid;

        return (
          <Link
            key={version.pid}
            href={`/schemas/${version.pid}`}
            prefetch={false}
            aria-current={isSelected ? "page" : undefined}
            className={`block rounded-xl border p-4 transition-all ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-base-300 hover:border-base-content/30 bg-base-100"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              v{version.version}
              {isLatest && (
                <Badge size="sm" variant="primary">
                  Latest
                </Badge>
              )}
            </div>
            <div className="mt-1 text-xs text-base-content/50">
              {new Date(version.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </Link>
        );
      })}
    </CollapsibleHistorySidebar>
  );
}
