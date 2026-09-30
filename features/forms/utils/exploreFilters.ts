import type { PublishedSchemaCardDTO } from "../types"
import { domainLabel, languageLabel, licenseLabel } from "../constants/publicationMetadataOptions"
import { contributorNamesLabel } from "./publicationMetadata"

export const EXPLORE_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
] as const

export type ExploreSort = (typeof EXPLORE_SORT_OPTIONS)[number]["value"]

/**
 * Everything the Explore page can filter on. Mirrors the URL one-to-one (see
 * `parseExploreFilters` / `exploreFiltersToParams`), so a search can be
 * bookmarked or shared.
 *
 * `domain`/`license`/`language`/`source` hold exact stored values and match if
 * the schema has ANY of them. `keyword`/`contributor` hold free text and
 * narrow: the schema must match ALL of them, each as a case-insensitive
 * "contains" — so picking a suggestion and typing a fragment behave the same.
 */
export interface ExploreFilters {
  q: string
  domain: string[]
  license: string[]
  language: string[]
  source: string[]
  keyword: string[]
  contributor: string[]
  /** `YYYY-MM-DD`, or "" for unbounded. Compared against the publication date. */
  after: string
  before: string
  sort: ExploreSort
}

export const EMPTY_EXPLORE_FILTERS: ExploreFilters = {
  q: "",
  domain: [],
  license: [],
  language: [],
  source: [],
  keyword: [],
  contributor: [],
  after: "",
  before: "",
  sort: "newest",
}

const MULTI_KEYS = ["domain", "license", "language", "source", "keyword", "contributor"] as const
export type ExploreMultiKey = (typeof MULTI_KEYS)[number]

type RawParams = Record<string, string | string[] | undefined>

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function all(value: string | string[] | undefined): string[] {
  const list = value === undefined ? [] : Array.isArray(value) ? value : [value]
  return Array.from(new Set(list.map((v) => v.trim()).filter(Boolean)))
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

/** Reads filters out of a page's `searchParams`, ignoring anything malformed. */
export function parseExploreFilters(params: RawParams): ExploreFilters {
  const sort = first(params.sort)
  const after = first(params.after)
  const before = first(params.before)

  return {
    q: first(params.q),
    domain: all(params.domain),
    license: all(params.license),
    language: all(params.language),
    source: all(params.source),
    keyword: all(params.keyword),
    contributor: all(params.contributor),
    after: DATE_PATTERN.test(after) ? after : "",
    before: DATE_PATTERN.test(before) ? before : "",
    sort: EXPLORE_SORT_OPTIONS.some((option) => option.value === sort) ? (sort as ExploreSort) : "newest",
  }
}

/** Same as `parseExploreFilters`, from a query string (e.g. a saved search) rather than a page's `searchParams`. */
export function parseExploreQueryString(query: string): ExploreFilters {
  const raw: Record<string, string[]> = {}
  new URLSearchParams(query).forEach((value, key) => {
    raw[key] = [...(raw[key] ?? []), value]
  })
  return parseExploreFilters(raw)
}

/** The inverse of `parseExploreFilters` — defaults are left out so a plain `/explore` stays plain. */
export function exploreFiltersToParams(filters: ExploreFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set("q", filters.q.trim())
  for (const key of MULTI_KEYS) {
    for (const value of filters[key]) params.append(key, value)
  }
  if (filters.after) params.set("after", filters.after)
  if (filters.before) params.set("before", filters.before)
  if (filters.sort !== "newest") params.set("sort", filters.sort)
  return params
}

/** Number of active filters, not counting the search box or the sort order. */
export function countActiveExploreFilters(filters: ExploreFilters): number {
  return (
    MULTI_KEYS.reduce((total, key) => total + filters[key].length, 0) +
    (filters.after || filters.before ? 1 : 0)
  )
}

const lower = (value: string) => value.toLowerCase()

/**
 * The text the search box looks through. Includes the display labels for
 * domain, license and language as well as the stored values, so searching
 * "creative commons" or "psychology" finds what the card visibly says.
 */
function haystackFor(schema: PublishedSchemaCardDTO): string {
  return lower(
    [
      schema.title,
      schema.description ?? "",
      contributorNamesLabel(schema),
      ...schema.keywords,
      schema.domain ?? "",
      domainLabel(schema.domain),
      schema.license,
      licenseLabel(schema.license),
      languageLabel(schema.language),
      schema.pid,
    ].join(" ")
  )
}

export function filterExploreSchemas(
  schemas: PublishedSchemaCardDTO[],
  filters: ExploreFilters
): PublishedSchemaCardDTO[] {
  // Every word has to appear somewhere, in any order — "memory spanish"
  // finds a Spanish-language memory schema that a single-phrase match misses.
  const terms = lower(filters.q).split(/\s+/).filter(Boolean)
  const keywordTerms = filters.keyword.map(lower)
  const contributorTerms = filters.contributor.map(lower)
  const afterTime = filters.after ? new Date(`${filters.after}T00:00:00`).getTime() : null
  const beforeTime = filters.before ? new Date(`${filters.before}T23:59:59.999`).getTime() : null

  const matched = schemas.filter((schema) => {
    if (filters.domain.length > 0 && (!schema.domain || !filters.domain.includes(schema.domain))) return false
    if (filters.license.length > 0 && !filters.license.includes(schema.license)) return false
    if (filters.language.length > 0 && !filters.language.includes(schema.language)) return false
    if (filters.source.length > 0 && !filters.source.includes(schema.source)) return false

    if (keywordTerms.length > 0) {
      const keywords = schema.keywords.map(lower)
      if (!keywordTerms.every((term) => keywords.some((keyword) => keyword.includes(term)))) return false
    }

    if (contributorTerms.length > 0) {
      const names = schema.contributors.map((contributor) => lower(contributor.name || ""))
      if (!contributorTerms.every((term) => names.some((name) => name.includes(term)))) return false
    }

    const publishedAt = new Date(schema.createdAt).getTime()
    if (afterTime !== null && publishedAt < afterTime) return false
    if (beforeTime !== null && publishedAt > beforeTime) return false

    if (terms.length === 0) return true
    const haystack = haystackFor(schema)
    return terms.every((term) => haystack.includes(term))
  })

  const byDate = (a: PublishedSchemaCardDTO, b: PublishedSchemaCardDTO) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

  if (filters.sort === "title") {
    return [...matched].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
  }
  return [...matched].sort((a, b) => (filters.sort === "oldest" ? byDate(a, b) : byDate(b, a)))
}

export interface ValueCount {
  value: string
  count: number
}

/**
 * Distinct values with how many schemas carry each, most common first — the
 * source for both suggestion lists and the counts shown on filter chips.
 * Values differing only by case are merged under the first spelling seen.
 */
export function countValues(
  schemas: PublishedSchemaCardDTO[],
  valuesOf: (schema: PublishedSchemaCardDTO) => (string | null | undefined)[]
): ValueCount[] {
  const counts = new Map<string, ValueCount>()
  for (const schema of schemas) {
    const seen = new Set<string>()
    for (const raw of valuesOf(schema)) {
      const value = raw?.trim()
      if (!value) continue
      const key = lower(value)
      if (seen.has(key)) continue
      seen.add(key)
      const existing = counts.get(key)
      if (existing) existing.count += 1
      else counts.set(key, { value, count: 1 })
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}
