import { describe, expect, it } from "vitest"
import type { PublishedSchemaCardDTO } from "../types"
import {
  EMPTY_EXPLORE_FILTERS,
  countActiveExploreFilters,
  countValues,
  exploreFiltersToParams,
  filterExploreSchemas,
  parseExploreFilters,
  parseExploreQueryString,
} from "./exploreFilters"

function schema(overrides: Partial<PublishedSchemaCardDTO> = {}): PublishedSchemaCardDTO {
  return {
    pid: "ps_1",
    title: "Working Memory Battery",
    description: "Span tasks for adults",
    version: "1.0.0",
    domain: "psychology",
    language: "en",
    license: "CC-BY-4.0",
    source: "native",
    keywords: ["working memory", "cognition"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    createdAt: new Date("2026-03-10T12:00:00"),
    versions: [],
    ...overrides,
  }
}

const memory = schema()
const survey = schema({
  pid: "ps_2",
  title: "Household Survey",
  description: null,
  domain: "economics",
  language: "es",
  license: "CC0-1.0",
  keywords: ["Income", "panel"],
  contributors: [{ name: "Ana Pérez", roles: ["Author"] }, { name: "Jane Doe", roles: ["Maintainer"] }],
  createdAt: new Date("2026-06-01T12:00:00"),
})
const all = [memory, survey]

const titles = (filters: Partial<typeof EMPTY_EXPLORE_FILTERS>) =>
  filterExploreSchemas(all, { ...EMPTY_EXPLORE_FILTERS, ...filters }).map((s) => s.title)

describe("filterExploreSchemas", () => {
  it("returns everything, newest first, with no filters", () => {
    expect(titles({})).toEqual(["Household Survey", "Working Memory Battery"])
  })

  it("requires every search word, in any order, across all searchable text", () => {
    expect(titles({ q: "doe memory" })).toEqual(["Working Memory Battery"])
    expect(titles({ q: "memory pérez" })).toEqual([])
  })

  it("searches the display labels, not just stored codes", () => {
    expect(titles({ q: "spanish" })).toEqual(["Household Survey"])
    expect(titles({ q: "creative commons" })).toEqual(["Working Memory Battery"])
  })

  it("matches any selected value within a facet", () => {
    expect(titles({ domain: ["psychology", "economics"] })).toHaveLength(2)
    expect(titles({ license: ["CC0-1.0"] })).toEqual(["Household Survey"])
  })

  it("treats keywords as case-insensitive contains, and requires all of them", () => {
    expect(titles({ keyword: ["income"] })).toEqual(["Household Survey"])
    expect(titles({ keyword: ["memory"] })).toEqual(["Working Memory Battery"])
    expect(titles({ keyword: ["memory", "panel"] })).toEqual([])
  })

  it("filters by contributor name", () => {
    expect(titles({ contributor: ["jane"] })).toHaveLength(2)
    expect(titles({ contributor: ["jane", "pérez"] })).toEqual(["Household Survey"])
  })

  it("bounds the publication date inclusively", () => {
    expect(titles({ after: "2026-06-01" })).toEqual(["Household Survey"])
    expect(titles({ before: "2026-03-10" })).toEqual(["Working Memory Battery"])
  })

  it("sorts by oldest and by title", () => {
    expect(titles({ sort: "oldest" })).toEqual(["Working Memory Battery", "Household Survey"])
    expect(titles({ sort: "title" })).toEqual(["Household Survey", "Working Memory Battery"])
  })
})

describe("parseExploreFilters / exploreFiltersToParams", () => {
  it("round-trips through the URL", () => {
    const filters = {
      ...EMPTY_EXPLORE_FILTERS,
      q: "memory",
      domain: ["psychology"],
      keyword: ["span", "adults"],
      after: "2026-01-01",
      sort: "title" as const,
    }
    const params = exploreFiltersToParams(filters)
    const raw: Record<string, string[]> = {}
    params.forEach((value, key) => (raw[key] = [...(raw[key] ?? []), value]))

    expect(parseExploreFilters(raw)).toEqual(filters)
  })

  it("reads a saved query string back into the same filters", () => {
    const filters = { ...EMPTY_EXPLORE_FILTERS, q: "memory span", keyword: ["a b", "c"], license: ["CC0-1.0"] }

    expect(parseExploreQueryString(exploreFiltersToParams(filters).toString())).toEqual(filters)
  })

  it("leaves defaults out of the URL", () => {
    expect(exploreFiltersToParams(EMPTY_EXPLORE_FILTERS).toString()).toBe("")
  })

  it("ignores malformed dates, unknown sorts, blanks and duplicates", () => {
    expect(
      parseExploreFilters({ after: "yesterday", sort: "random", keyword: ["a", " a ", ""], q: ["x", "y"] })
    ).toEqual({ ...EMPTY_EXPLORE_FILTERS, keyword: ["a"], q: "x" })
  })
})

describe("countActiveExploreFilters", () => {
  it("counts selected values, and a date range once", () => {
    expect(countActiveExploreFilters(EMPTY_EXPLORE_FILTERS)).toBe(0)
    expect(
      countActiveExploreFilters({
        ...EMPTY_EXPLORE_FILTERS,
        q: "ignored",
        domain: ["a", "b"],
        keyword: ["c"],
        after: "2026-01-01",
        before: "2026-02-01",
      })
    ).toBe(4)
  })
})

describe("countValues", () => {
  it("counts each value once per schema, most common first, merging case", () => {
    const counts = countValues(
      [memory, survey, schema({ keywords: ["Cognition", "cognition", "income"] })],
      (s) => s.keywords
    )

    expect(counts.slice(0, 2)).toEqual([
      { value: "cognition", count: 2 },
      { value: "Income", count: 2 },
    ])
  })
})
