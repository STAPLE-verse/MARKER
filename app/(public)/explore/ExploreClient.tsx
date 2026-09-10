"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import type { SelectOption } from "@/components/ui/Select";
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/Sidebar";
import {
  domainLabel,
  labelForSelectValue,
  languageLabel,
  licenseLabel,
  PUBLICATION_DOMAIN_OPTIONS,
  PUBLICATION_LANGUAGE_OPTIONS,
  PUBLICATION_LICENSE_OPTIONS,
} from "@/features/forms/constants/publicationMetadataOptions";
import type { PublishedSchemaCardDTO } from "@/features/forms/types";

interface ExploreClientProps {
  schemas: PublishedSchemaCardDTO[];
}

const PAGE_SIZE = 10;

// Only "native" can appear in the DB today (publishSchema.ts hardcodes it) — see
// docs/refactor/explore.md §2.3. Listed here as MARKER's own source vocabulary,
// not a publication-metadata field, so it doesn't belong in publicationMetadataOptions.ts.
const CANONICAL_SOURCE_OPTIONS: SelectOption[] = [
  { value: "native", label: "Native" },
  { value: "cedar", label: "CEDAR" },
];

/**
 * A filter's canonical option list (e.g. `PUBLICATION_LICENSE_OPTIONS`) can
 * miss values that are actually stored on published, immutable rows — legacy
 * data written before the canonical list existed, a typo that predates
 * strict validation, or (later) an external-catalog import using a different
 * vocabulary. Per docs/refactor/explore.md §2.5's stance on not silently
 * hiding what an immutable record actually contains: every real value must
 * remain selectable in its filter, even if it isn't one of the "known" ones,
 * or that schema becomes permanently unreachable by filtering — which is
 * what happened here (a `"CC-BY 4.0"` row against the canonical
 * `"CC-BY-4.0"`).
 */
function withPresentValues(
  canonical: SelectOption[],
  present: (string | null)[],
  labelFor: (value: string) => string
): SelectOption[] {
  const known = new Set(canonical.map((option) => option.value));
  const extra = Array.from(
    new Set(present.filter((value): value is string => value !== null && value !== "" && !known.has(value)))
  );
  return [...canonical, ...extra.map((value) => ({ value, label: labelFor(value) }))];
}

function toggleValue(selected: string[], value: string): string[] {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

/** One filter's checkbox list — unchecked means "no filter on this dimension", not "match nothing". */
function FilterCheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: SelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            className="checkbox-sm checkbox-primary"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function contributorNamesLabel(schema: PublishedSchemaCardDTO): string {
  if (schema.contributors.length === 0) return schema.authorName ?? "Unknown";
  return schema.contributors.map((contributor) => contributor.name || "Unnamed").join(", ");
}

function publishedOnLabel(createdAt: Date): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * The version badge on an Explore card. A family with only one published
 * version renders as a plain badge (nothing to pick between). A family with
 * more renders as a dropdown listing every sibling version — newest first,
 * same order as `PublishedSchemaCardDTO.versions` — each linking straight to
 * that version's own `/schemas/[pid]`.
 */
function VersionBadge({ schema }: { schema: PublishedSchemaCardDTO }) {
  if (schema.versions.length <= 1) {
    return (
      <Badge variant="secondary" outline size="sm" className="font-mono">
        v{schema.version}
      </Badge>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Badge variant="secondary" outline size="sm" className="font-mono cursor-pointer gap-0.5">
          v{schema.version}
          <ChevronDownIcon className="w-3 h-3" />
        </Badge>
      </DropdownTrigger>
      <DropdownContent className="w-64">
        {schema.versions.map((version) => (
          <DropdownItem key={version.pid}>
            <Link href={`/schemas/${version.pid}`} className="flex items-center justify-between gap-2">
              <span className={version.pid === schema.pid ? "font-semibold" : ""}>v{version.version}</span>
              <span className="text-xs text-base-content/50 whitespace-nowrap">
                {publishedOnLabel(version.createdAt)}
              </span>
            </Link>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

export default function ExploreClient({ schemas }: ExploreClientProps) {
  const [search, setSearch] = useState("");
  const [domainFilters, setDomainFilters] = useState<string[]>([]);
  const [licenseFilters, setLicenseFilters] = useState<string[]>([]);
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  // Filters against PublishedSchema.createdAt, which is the publication
  // timestamp itself (set once at publish, in publishSchema.ts's
  // `create()` call — never touched again, same as everything else on an
  // immutable published row). "" means unbounded on that side.
  const [publishedAfter, setPublishedAfter] = useState("");
  const [publishedBefore, setPublishedBefore] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const domainOptions = useMemo(
    () => withPresentValues(PUBLICATION_DOMAIN_OPTIONS, schemas.map((s) => s.domain), domainLabel),
    [schemas]
  );
  const licenseOptions = useMemo(
    () => withPresentValues(PUBLICATION_LICENSE_OPTIONS, schemas.map((s) => s.license), licenseLabel),
    [schemas]
  );
  const languageOptions = useMemo(
    () => withPresentValues(PUBLICATION_LANGUAGE_OPTIONS, schemas.map((s) => s.language), languageLabel),
    [schemas]
  );
  const sourceOptions = useMemo(
    () =>
      withPresentValues(CANONICAL_SOURCE_OPTIONS, schemas.map((s) => s.source), (value) =>
        labelForSelectValue(value, CANONICAL_SOURCE_OPTIONS)
      ),
    [schemas]
  );

  // Reset pagination whenever the search term or any filter changes — a
  // render-time state adjustment (not an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect
  const filterKey = `${search}|${domainFilters.join(",")}|${licenseFilters.join(",")}|${languageFilters.join(",")}|${sourceFilters.join(",")}|${publishedAfter}|${publishedBefore}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const hasActiveFilters =
    domainFilters.length > 0 ||
    licenseFilters.length > 0 ||
    languageFilters.length > 0 ||
    sourceFilters.length > 0 ||
    publishedAfter !== "" ||
    publishedBefore !== "";

  // Clears only the sidebar's own filters — the search box above the card
  // feed is a separate control (main content, not the sidebar), left as-is.
  const clearAllFilters = () => {
    setDomainFilters([]);
    setLicenseFilters([]);
    setLanguageFilters([]);
    setSourceFilters([]);
    setPublishedAfter("");
    setPublishedBefore("");
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return schemas.filter((schema) => {
      if (domainFilters.length > 0 && (!schema.domain || !domainFilters.includes(schema.domain))) return false;
      if (licenseFilters.length > 0 && !licenseFilters.includes(schema.license)) return false;
      if (languageFilters.length > 0 && !languageFilters.includes(schema.language)) return false;
      if (sourceFilters.length > 0 && !sourceFilters.includes(schema.source)) return false;

      const publishedAt = new Date(schema.createdAt).getTime();
      if (publishedAfter && publishedAt < new Date(`${publishedAfter}T00:00:00`).getTime()) return false;
      if (publishedBefore && publishedAt > new Date(`${publishedBefore}T23:59:59.999`).getTime()) return false;

      if (!term) return true;
      const haystack = [
        schema.title,
        schema.description ?? "",
        contributorNamesLabel(schema),
        ...schema.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [schemas, search, domainFilters, licenseFilters, languageFilters, sourceFilters, publishedAfter, publishedBefore]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="relative min-h-screen bg-base-100 overflow-hidden flex">
      {/* Docked to the viewport edge and styled like VersionHistorySidebar on
          /collection/[id] (same bg/border/header treatment, and the same
          overflow-hidden shell + h-screen main content pairing that gives
          the sidebar its own independent scroll region — see
          FormPageLayout.tsx), mirrored to the left per user request. */}
      <Sidebar className="absolute left-0 top-0 bottom-0 z-20 w-80 lg:w-96 border-r border-base-300 shadow-2xl overflow-y-auto">
        <SidebarHeader className="bg-base-200/50 gap-2 justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            <span className="text-lg font-bold">Filters</span>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </SidebarHeader>
        <SidebarContent className="bg-base-200/30 space-y-5 pb-10">
          <FilterCheckboxGroup
            label="Domain"
            options={domainOptions}
            selected={domainFilters}
            onToggle={(value) => setDomainFilters((prev) => toggleValue(prev, value))}
          />
          <FilterCheckboxGroup
            label="License"
            options={licenseOptions}
            selected={licenseFilters}
            onToggle={(value) => setLicenseFilters((prev) => toggleValue(prev, value))}
          />
          <FilterCheckboxGroup
            label="Language"
            options={languageOptions}
            selected={languageFilters}
            onToggle={(value) => setLanguageFilters((prev) => toggleValue(prev, value))}
          />
          <FilterCheckboxGroup
            label="Source"
            options={sourceOptions}
            selected={sourceFilters}
            onToggle={(value) => setSourceFilters((prev) => toggleValue(prev, value))}
          />
          <div>
            <p className="text-sm font-semibold mb-1.5">Published</p>
            <div className="flex flex-col gap-2">
              <Input
                type="date"
                label="After"
                value={publishedAfter}
                onChange={(event) => setPublishedAfter(event.target.value)}
              />
              <Input
                type="date"
                label="Before"
                value={publishedBefore}
                onChange={(event) => setPublishedBefore(event.target.value)}
              />
            </div>
          </div>
        </SidebarContent>
      </Sidebar>

      <div className="flex-1 h-screen overflow-y-auto pl-80 lg:pl-96">
        <div className="px-4 py-8 max-w-6xl animate-in fade-in duration-300">
          <PageHeader
            title="Explore Public Schemas"
            description="Search, view, and reuse standardized metadata templates published by the community."
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles, descriptions, contributors, keywords..."
            className="mb-6"
          />

          {visible.length === 0 && (
            <p className="text-center text-base-content/60 py-12">
              No public schemas found. Try adjusting your search or filters.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {visible.map((schema) => (
              <Card
                key={schema.pid}
                bordered
                className="bg-base-300 border-base-content/10 hover:shadow-lg transition-shadow"
              >
                <CardBody className="pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/schemas/${schema.pid}`} className="hover:underline">
                        <h2 className="text-xl font-bold">{schema.title}</h2>
                      </Link>
                      <VersionBadge schema={schema} />
                      <Badge variant="primary" outline size="sm">
                        {domainLabel(schema.domain)}
                      </Badge>
                    </div>
                    <p className="text-sm text-base-content/70 mt-0">
                      {contributorNamesLabel(schema)}
                    </p>
                  </div>

                  {schema.description && (
                    <p className="text-base-content/85 line-clamp-3 mt-2">{schema.description}</p>
                  )}

                  {schema.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {schema.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="badge badge-outline badge-sm border-base-content/20 text-base-content/60"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-base-content/50">
                    {licenseLabel(schema.license)} · Published {publishedOnLabel(schema.createdAt)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" outline onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
