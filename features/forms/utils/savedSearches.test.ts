import { describe, expect, it } from "vitest"
import { MAX_SAVED_SEARCHES, addSavedSearch, parseSavedSearches, removeSavedSearch } from "./savedSearches"

const entry = (id: string, name: string, query = "q=x") => ({ id, name, query, savedAt: "2026-09-30T00:00:00.000Z" })

describe("parseSavedSearches", () => {
  it("returns an empty list for nothing, junk, or the wrong shape", () => {
    expect(parseSavedSearches(null)).toEqual([])
    expect(parseSavedSearches("not json")).toEqual([])
    expect(parseSavedSearches('{"a":1}')).toEqual([])
  })

  it("keeps valid entries and drops malformed ones", () => {
    const raw = JSON.stringify([entry("1", "Memory"), { id: 2, name: "bad" }, null])
    expect(parseSavedSearches(raw)).toEqual([entry("1", "Memory")])
  })
})

describe("addSavedSearch", () => {
  it("puts the newest first and trims the name", () => {
    const list = addSavedSearch([entry("1", "Old")], entry("2", "  New  "))
    expect(list.map((s) => s.name)).toEqual(["New", "Old"])
  })

  it("replaces an entry with the same name, ignoring case", () => {
    const list = addSavedSearch([entry("1", "Memory", "q=a")], entry("2", "memory", "q=b"))
    expect(list).toEqual([entry("2", "memory", "q=b")])
  })

  it("ignores a blank name", () => {
    const existing = [entry("1", "Old")]
    expect(addSavedSearch(existing, entry("2", "   "))).toBe(existing)
  })

  it("caps the list, dropping the oldest", () => {
    const full = Array.from({ length: MAX_SAVED_SEARCHES }, (_, i) => entry(String(i), `Search ${i}`))
    const list = addSavedSearch(full, entry("new", "Newest"))
    expect(list).toHaveLength(MAX_SAVED_SEARCHES)
    expect(list[0].name).toBe("Newest")
    expect(list.some((s) => s.id === String(MAX_SAVED_SEARCHES - 1))).toBe(false)
  })
})

describe("removeSavedSearch", () => {
  it("removes by id", () => {
    expect(removeSavedSearch([entry("1", "A"), entry("2", "B")], "1")).toEqual([entry("2", "B")])
  })
})
