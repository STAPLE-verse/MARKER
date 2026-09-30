"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getBreadcrumbLabel,
  type BreadcrumbLabelInput,
} from "@/features/forms/actions/getBreadcrumbLabel";

/** Display names for static path segments. Anything missing falls back to a title-cased segment. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  collection: "My Collection",
  explore: "Explore",
  schemas: "Explore",
  notifications: "Notifications",
  profile: "Profile",
  new: "New",
  blank: "Blank",
  staple: "From STAPLE",
  edit: "Edit",
  publish: "Publish",
  password: "Password",
};

/** Segments with no page of their own, mapped to the page their crumb should link to instead. */
const HREF_OVERRIDES: Record<string, string> = {
  "/schemas": "/explore",
};

/** Parent segments whose child is a record id/pid — its crumb shows the record's name, looked up by type. */
const SEGMENT_TO_TYPE: Record<string, BreadcrumbLabelInput["type"]> = {
  collection: "form",
  schemas: "schema",
};

/** Shown for a record crumb whose name couldn't be resolved. */
const RECORD_FALLBACK_LABEL = "Schema";

const MAX_LABEL_LENGTH = 40;

/** The record a segment points at, or null when it's a static page (`/collection/new`). */
function recordFor(segment: string, prevSegment: string | undefined): BreadcrumbLabelInput | null {
  const type = prevSegment ? SEGMENT_TO_TYPE[prevSegment] : undefined;
  if (!type || SEGMENT_LABELS[segment]) return null;
  if (type === "form" && !/^\d+$/.test(segment)) return null;
  return { type, id: segment };
}

const cacheKey = (record: BreadcrumbLabelInput) => `${record.type}:${record.id}`;

const titleCase = (segment: string) =>
  segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface BreadcrumbsProps {
  /** Where the leading "Home" crumb points — the dashboard when logged in, the landing page otherwise. */
  homeHref: string;
}

/**
 * Breadcrumbs — the path trail shown next to the logo in the navbar, ported
 * from STAPLE's `BreadCrumbs`. Built from the current URL, so it needs no
 * per-page wiring; record segments show a skeleton until their name loads.
 */
export function Breadcrumbs({ homeHref }: BreadcrumbsProps) {
  const pathname = usePathname() ?? "";
  // Keyed `type:id`. `null` = looked up, no name available; missing = not loaded yet.
  const [names, setNames] = useState<Record<string, string | null>>({});

  // Re-fetched on every navigation rather than only on a cache miss, so a
  // form renamed in the editor shows its new name on the next page — the
  // cached value just keeps the crumb from flashing a skeleton meanwhile.
  useEffect(() => {
    let cancelled = false;
    const segments = pathname.split("/").filter((seg) => seg.length > 0);

    segments.forEach((segment, index) => {
      const record = recordFor(segment, segments[index - 1]);
      if (!record) return;

      getBreadcrumbLabel(record)
        .catch(() => null)
        .then((name) => {
          if (!cancelled) setNames((prev) => ({ ...prev, [cacheKey(record)]: name }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const segments = pathname.split("/").filter((seg) => seg.length > 0);

  return (
    <div className="breadcrumbs text-base min-w-0">
      <ul>
        <li>
          {segments.length === 0 ? (
            <span className="font-bold text-base-content">Home</span>
          ) : (
            <Link href={homeHref} className="hover:underline">
              Home
            </Link>
          )}
        </li>
        {segments.map((segment, index) => {
          const path = "/" + segments.slice(0, index + 1).join("/");
          const record = recordFor(segment, segments[index - 1]);
          const name = record ? names[cacheKey(record)] : undefined;
          const isLoading = record !== null && name === undefined;
          const displayLabel = record
            ? name ?? RECORD_FALLBACK_LABEL
            : SEGMENT_LABELS[segment] ?? titleCase(segment);
          const truncated =
            displayLabel.length > MAX_LABEL_LENGTH
              ? displayLabel.slice(0, MAX_LABEL_LENGTH) + "..."
              : displayLabel;
          const isLast = index === segments.length - 1;

          const label = isLoading ? (
            <span className="skeleton h-4 w-20 inline-block rounded" />
          ) : (
            <span aria-label={displayLabel} title={displayLabel}>
              {truncated}
            </span>
          );

          return (
            <li key={path}>
              {isLast ? (
                <span className="font-bold text-base-content">{label}</span>
              ) : (
                <Link href={HREF_OVERRIDES[path] ?? path} className="hover:underline">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
