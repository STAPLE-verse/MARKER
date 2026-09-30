/**
 * Saved Explore searches, kept in this browser's localStorage — no account
 * and no database table involved (MARKER doesn't own its schema; a server-side
 * version would have to be migrated through STAPLE). Each one is just a name
 * plus the same query string the Explore page puts in the address bar.
 */
export interface SavedSearch {
  id: string
  name: string
  /** `exploreFiltersToParams(...).toString()` at the time of saving. */
  query: string
  savedAt: string
}

export const SAVED_SEARCHES_STORAGE_KEY = "marker:explore:saved-searches"
export const MAX_SAVED_SEARCHES = 50
export const MAX_SAVED_SEARCH_NAME_LENGTH = 80

function isSavedSearch(value: unknown): value is SavedSearch {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.query === "string" &&
    typeof record.savedAt === "string"
  )
}

/** Reads the stored list, tolerating anything that isn't what this module wrote. */
export function parseSavedSearches(raw: string | null): SavedSearch[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSavedSearch) : []
  } catch {
    return []
  }
}

/**
 * Adds a search to the front of the list. Saving under a name that already
 * exists (ignoring case) replaces that entry rather than leaving two with the
 * same name; the oldest entries fall off past `MAX_SAVED_SEARCHES`.
 */
export function addSavedSearch(
  searches: SavedSearch[],
  entry: { id: string; name: string; query: string; savedAt: string }
): SavedSearch[] {
  const name = entry.name.trim().slice(0, MAX_SAVED_SEARCH_NAME_LENGTH)
  if (!name) return searches
  const others = searches.filter((search) => search.name.toLowerCase() !== name.toLowerCase())
  return [{ ...entry, name }, ...others].slice(0, MAX_SAVED_SEARCHES)
}

export function removeSavedSearch(searches: SavedSearch[], id: string): SavedSearch[] {
  return searches.filter((search) => search.id !== id)
}
