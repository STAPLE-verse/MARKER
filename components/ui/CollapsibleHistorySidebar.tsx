"use client";

import React from "react";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/Badge";
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/Sidebar";

interface CollapsibleHistorySidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** Total row count, shown as a badge on the toggle button while collapsed. */
  versionCount: number;
  /** The version rows, rendered inside `SidebarContent` while open. */
  children: React.ReactNode;
}

/**
 * Shared collapsible right-rail shell for a "version history" sidebar —
 * the `Sidebar` sizing/transition, the header's expand/collapse toggle with
 * its collapsed-state count badge, and the collapsed vertical "History"
 * label. Extracted from `VersionHistorySidebar` (`/collection/[id]`, owner
 * view with draft/delete controls) and `PublishedVersionsSidebar`
 * (`/schemas/[pid]`, public read-only view) once it became clear those two
 * differ only in their row content, not in this shell.
 */
export function CollapsibleHistorySidebar({
  isOpen,
  setIsOpen,
  versionCount,
  children,
}: CollapsibleHistorySidebarProps) {
  return (
    <Sidebar
      className={`absolute right-0 top-0 bottom-0 z-20 border-l border-base-300 shadow-2xl overflow-hidden transition-all duration-300 ${
        isOpen ? "w-80 lg:w-96" : "w-16 min-w-[4rem] lg:w-16 shadow-none"
      }`}
    >
      <SidebarHeader className={`bg-base-200/50 flex ${isOpen ? "justify-between p-4" : "justify-center p-2"}`}>
        {isOpen && (
          <div className="flex items-center gap-2 text-lg font-bold">
            <ClockIcon className="w-5 h-5" />
            Version History
          </div>
        )}
        <div className={!isOpen && versionCount > 1 ? "indicator" : ""}>
          {!isOpen && versionCount > 1 && (
            <Badge size="xs" variant="primary" className="indicator-item indicator-top indicator-end shadow-sm">
              {versionCount}
            </Badge>
          )}
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => setIsOpen(!isOpen)}
            title="Toggle Version History"
            type="button"
          >
            {isOpen ? <XMarkIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
          </button>
        </div>
      </SidebarHeader>

      {isOpen ? (
        <SidebarContent className="space-y-3 bg-base-200/30">{children}</SidebarContent>
      ) : (
        <div className="flex-1 bg-base-200/30 flex flex-col items-center pt-4">
          <div
            className="text-vertical writing-mode-vertical-rl rotate-180 text-sm font-semibold tracking-widest text-base-content/40 uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            History
          </div>
        </div>
      )}
    </Sidebar>
  );
}
