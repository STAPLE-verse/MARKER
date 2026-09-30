"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/Dropdown";
import { MultiValueFilter } from "@/components/ui/MultiValueFilter";
import type { SelectOption } from "@/components/ui/Select";
import { STAPLE_INPUT_CLASS, STAPLE_SELECT_CLASS } from "@/components/ui/fieldStyles";
import { cn } from "@/lib/utils";
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
import {
  EMPTY_EXPLORE_FILTERS,
  EXPLORE_SORT_OPTIONS,
  countActiveExploreFilters,
  countValues,
  exploreFiltersToParams,
  filterExploreSchemas,
  parseExploreQueryString,
  type ExploreFilters,
  type ExploreMultiKey,
  type ExploreSort,
  type ValueCount,
} from "@/features/forms/utils/exploreFilters";
import { contributorNamesLabel } from "@/features/forms/utils/publicationMetadata";
import { SavedSearches } from "./SavedSearches";

interface ExploreClientProps {
  schemas: PublishedSchemaCardDTO[];
  /** Filters read from the URL on the server, so a shared or bookmarked search opens already applied. */
  initialFilters: ExploreFilters;
}

const PAGE_SIZE = 10;

/** How many of the catalog's most-used keywords are offered as one-click chips under the search box. */
const POPULAR_KEYWORD_COUNT = 10;

// Only "native" can appear in the DB today (publishSchema.ts hardcodes it) — see
// docs/refactor/explore.md §2.3. Listed here as MARKER's own source vocabulary,
// not a publication-metadata field, so it doesn't belong in publicationMetadataOptions.ts.
const CANONICAL_SOURCE_OPTIONS: SelectOption[] = [
  { value: "native", label: "Native" },
  { value: "cedar", label: "CEDAR" },
];

const sourceLabel = (value: string) => labelForSelectValue(value, CANONICAL_SOURCE_OPTIONS);

interface FacetOption extends SelectOption {
  count: number;
}

/**
 * A facet's chips: the canonical option list (e.g. `PUBLICATION_LICENSE_OPTIONS`)
 * plus every value actually stored on a published row, each with how many
 * schemas carry it. The canonical list alone can miss real values — legacy
 * data written before the list existed, a typo that predates strict
 * validation, or (later) an external-catalog import using a different
 * vocabulary. Per docs/refactor/explore.md §2.5's stance on not silently
 * hiding what an immutable record actually contains: every real value must
 * remain selectable in its filter, or that schema becomes permanently
 * unreachable by filtering (a `"CC-BY 4.0"` row against the canonical
 * `"CC-BY-4.0"` did exactly that).
 */
function facetOptions(
  canonical: SelectOption[],
  present: ValueCount[],
  labelFor: (value: string) => string
): FacetOption[] {
  const counts = new Map(present.map((entry) => [entry.value, entry.count]));
  const known = new Set(canonical.map((option) => option.value));
  return [
    ...canonical.map((option) => ({ ...option, count: counts.get(option.value) ?? 0 })),
    ...present
      .filter((entry) => !known.has(entry.value))
      .map((entry) => ({ value: entry.value, label: labelFor(entry.value), count: entry.count })),
  ];
}

const CHIP_CLASS = "badge badge-lg h-auto min-h-7 py-1 whitespace-normal text-left cursor-pointer transition-colors";

/** Fields inside the filter card: the shared STAPLE look on the page color, since the card itself is `base-300`. */
const CARD_INPUT_CLASS = `${STAPLE_INPUT_CLASS} bg-base-100`;
const CARD_SELECT_CLASS = `${STAPLE_SELECT_CLASS} bg-base-100`;

/** One labelled cell of the filter grid — label above the field, same label style as every other form. */
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xl">{label}</span>
      {children}
    </div>
  );
}

/**
 * One facet as a dropdown: "All", then every option with how many schemas
 * carry it. Picking one filters to that value; "All" clears the facet.
 */
function FacetSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: FacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <FilterField label={label}>
      <select
        aria-label={label}
        value={selected[0] ?? ""}
        onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}
        className={cn("select select-md text-base w-full", CARD_SELECT_CLASS)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </FilterField>
  );
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
      <Badge variant="secondary" outline size="md" className="font-mono">
        v{schema.version}
      </Badge>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Badge variant="secondary" outline size="md" className="font-mono cursor-pointer gap-0.5">
          v{schema.version}
          <ChevronDownIcon className="w-3 h-3" />
        </Badge>
      </DropdownTrigger>
      <DropdownContent className="w-64">
        {schema.versions.map((version) => (
          <DropdownItem key={version.pid}>
            <Link href={`/schemas/${version.pid}`} className="flex items-center justify-between gap-2">
              <span className={version.pid === schema.pid ? "font-semibold" : ""}>v{version.version}</span>
              <span className="text-base text-base-content/90 whitespace-nowrap">
                {publishedOnLabel(version.createdAt)}
              </span>
            </Link>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

export default function ExploreClient({ schemas, initialFilters }: ExploreClientProps) {
  const [filters, setFilters] = useState<ExploreFilters>(initialFilters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const domainOptions = useMemo(
    () => facetOptions(PUBLICATION_DOMAIN_OPTIONS, countValues(schemas, (s) => [s.domain]), domainLabel),
    [schemas]
  );
  const licenseOptions = useMemo(
    () => facetOptions(PUBLICATION_LICENSE_OPTIONS, countValues(schemas, (s) => [s.license]), licenseLabel),
    [schemas]
  );
  const languageOptions = useMemo(
    () => facetOptions(PUBLICATION_LANGUAGE_OPTIONS, countValues(schemas, (s) => [s.language]), languageLabel),
    [schemas]
  );
  const sourceOptions = useMemo(
    () => facetOptions(CANONICAL_SOURCE_OPTIONS, countValues(schemas, (s) => [s.source]), sourceLabel),
    [schemas]
  );
  const keywordCounts = useMemo(() => countValues(schemas, (s) => s.keywords), [schemas]);
  const contributorCounts = useMemo(
    () => countValues(schemas, (s) => s.contributors.map((contributor) => contributor.name)),
    [schemas]
  );

  // A source filter is only worth a row once the catalog actually holds more than one source.
  const showSourceFilter = sourceOptions.filter((option) => option.count > 0).length > 1 || filters.source.length > 0;

  const activeCount = countActiveExploreFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Keep the address bar in step with the filters so the current search can
  // be bookmarked or shared. `replaceState` rather than a router navigation:
  // filtering happens entirely in the browser, so there's nothing to refetch.
  const queryString = exploreFiltersToParams(filters).toString();
  useEffect(() => {
    const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [queryString]);

  // Reset pagination whenever the search term or any filter changes — a
  // render-time state adjustment (not an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [lastQueryString, setLastQueryString] = useState(queryString);
  if (queryString !== lastQueryString) {
    setLastQueryString(queryString);
    setVisibleCount(PAGE_SIZE);
  }

  const update = (patch: Partial<ExploreFilters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const toggle = (key: ExploreMultiKey, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));

  // Clears the filters but leaves the search box and sort order alone.
  const clearAllFilters = () => setFilters((prev) => ({ ...EMPTY_EXPLORE_FILTERS, q: prev.q, sort: prev.sort }));

  const filtered = useMemo(() => filterExploreSchemas(schemas, filters), [schemas, filters]);
  const visible = filtered.slice(0, visibleCount);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.domain.map((v) => ({ key: `domain:${v}`, label: domainLabel(v), onRemove: () => toggle("domain", v) })),
    ...filters.license.map((v) => ({ key: `license:${v}`, label: licenseLabel(v), onRemove: () => toggle("license", v) })),
    ...filters.language.map((v) => ({ key: `language:${v}`, label: languageLabel(v), onRemove: () => toggle("language", v) })),
    ...filters.source.map((v) => ({ key: `source:${v}`, label: sourceLabel(v), onRemove: () => toggle("source", v) })),
    ...filters.keyword.map((v) => ({ key: `keyword:${v}`, label: `Keyword: ${v}`, onRemove: () => toggle("keyword", v) })),
    ...filters.contributor.map((v) => ({
      key: `contributor:${v}`,
      label: `Contributor: ${v}`,
      onRemove: () => toggle("contributor", v),
    })),
    ...(filters.after || filters.before
      ? [
          {
            key: "published",
            label: `Published ${filters.after || "…"} – ${filters.before || "…"}`,
            onRemove: () => update({ after: "", before: "" }),
          },
        ]
      : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Explore Public Schemas"
        description="Search, view, and reuse standardized metadata templates published by the community."
      />

      <input
        type="search"
        value={filters.q}
        onChange={(event) => update({ q: event.target.value })}
        placeholder="Search titles, descriptions, contributors, keywords..."
        aria-label="Search public schemas"
        className={cn("input input-lg w-full bg-base-300", STAPLE_INPUT_CLASS)}
      />

      {keywordCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-base text-base-content/90">Popular keywords:</span>
          {keywordCounts.slice(0, POPULAR_KEYWORD_COUNT).map(({ value }) => {
            const isSelected = filters.keyword.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle("keyword", value)}
                className={`${CHIP_CLASS} ${isSelected ? "badge-primary" : "badge-ghost hover:bg-base-300"}`}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}

      <details
        className="mt-4 group"
        open={filtersOpen}
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none text-lg font-semibold flex items-center gap-2 w-fit">
          <ChevronDownIcon className="w-5 h-5 -rotate-90 transition-transform group-open:rotate-0" aria-hidden="true" />
          <FunnelIcon className="w-5 h-5" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <Badge variant="primary" size="md">
              {activeCount}
            </Badge>
          )}
        </summary>

        <Card bordered className="mt-3">
          <CardBody className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FacetSelect
              label="Domain"
              allLabel="All domains"
              options={domainOptions}
              selected={filters.domain}
              onChange={(domain) => update({ domain })}
            />
            <FacetSelect
              label="License"
              allLabel="All licenses"
              options={licenseOptions}
              selected={filters.license}
              onChange={(license) => update({ license })}
            />
            <FacetSelect
              label="Language"
              allLabel="All languages"
              options={languageOptions}
              selected={filters.language}
              onChange={(language) => update({ language })}
            />
            {showSourceFilter && (
              <FacetSelect
                label="Source"
                allLabel="All sources"
                options={sourceOptions}
                selected={filters.source}
                onChange={(source) => update({ source })}
              />
            )}
            <FilterField label="Keywords">
              <MultiValueFilter
                label="Filter by keyword"
                placeholder="Type a keyword…"
                values={filters.keyword}
                onChange={(keyword) => update({ keyword })}
                suggestions={keywordCounts}
                allowFreeText
                inputClassName={CARD_INPUT_CLASS}
              />
            </FilterField>
            <FilterField label="Contributors">
              <MultiValueFilter
                label="Filter by contributor"
                placeholder="Type a name…"
                values={filters.contributor}
                onChange={(contributor) => update({ contributor })}
                suggestions={contributorCounts}
                allowFreeText
                inputClassName={CARD_INPUT_CLASS}
              />
            </FilterField>
            <FilterField label="Published from">
              <input
                type="date"
                aria-label="Published on or after"
                value={filters.after}
                max={filters.before || undefined}
                onChange={(event) => update({ after: event.target.value })}
                className={cn("input input-md text-base w-full", CARD_INPUT_CLASS)}
              />
            </FilterField>
            <FilterField label="Published to">
              <input
                type="date"
                aria-label="Published on or before"
                value={filters.before}
                min={filters.after || undefined}
                onChange={(event) => update({ before: event.target.value })}
                className={cn("input input-md text-base w-full", CARD_INPUT_CLASS)}
              />
            </FilterField>
          </CardBody>
        </Card>
      </details>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="badge badge-lg h-auto min-h-7 py-1 whitespace-normal gap-1 bg-base-300 border border-base-content/10"
            >
              {chip.label}
              <button type="button" onClick={chip.onRemove} aria-label={`Remove filter: ${chip.label}`} className="cursor-pointer">
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>
          ))}
          <Button variant="secondary" size="md" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      <SavedSearches
        currentQuery={queryString}
        suggestedName={filters.q.trim() || activeChips[0]?.label || ""}
        onApply={(query) => setFilters(parseExploreQueryString(query))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-4">
        <p className="text-lg" role="status">
          {filtered.length === schemas.length
            ? `${schemas.length} ${schemas.length === 1 ? "schema" : "schemas"}`
            : `${filtered.length} of ${schemas.length} schemas`}
        </p>
        <label className="flex items-center gap-2 text-base">
          Sort by
          <select
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value as ExploreSort })}
            className={cn("select select-md text-base w-auto bg-base-300", STAPLE_SELECT_CLASS)}
          >
            {EXPLORE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 && (
        <p className="text-center text-lg text-base-content/90 py-12">
          {schemas.length === 0
            ? "No schemas have been published yet."
            : "No public schemas match. Try fewer search words or remove a filter."}
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
                  <Badge variant="primary" outline size="md">
                    {domainLabel(schema.domain)}
                  </Badge>
                </div>
                <p className="text-base text-base-content/90 mt-0">
                  {contributorNamesLabel(schema)}
                </p>
              </div>

              {schema.description && (
                <p className="text-base-content/90 line-clamp-3 mt-2">{schema.description}</p>
              )}

              {schema.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {schema.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="badge badge-outline badge-md text-base border-base-content/20 text-base-content/90"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-base text-base-content/90">
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
  );
}
