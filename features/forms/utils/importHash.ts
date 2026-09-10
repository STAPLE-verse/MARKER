import { createHash } from "crypto"

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

/**
 * Content baseline for "modified since import" (docs/refactor/import.md §8.4).
 * Hashes only `{ schema, uiSchema }` — never timestamps, source IDs,
 * publication metadata, or the separately stored version name. Missing/null
 * uiSchema normalizes to `{}` before hashing so an absent uiSchema and an
 * explicit `{}` hash identically. Array order is preserved (not sorted).
 */
export function hashImportedSnapshot(
  schema: Record<string, unknown>,
  uiSchema: Record<string, unknown> | null | undefined
): string {
  const canonical = canonicalize({ schema, uiSchema: uiSchema ?? {} })
  const digest = createHash("sha256").update(JSON.stringify(canonical)).digest("hex")
  return `sha256:${digest}`
}

export type ImportModificationStatus = "UNMODIFIED" | "MODIFIED" | "UNKNOWN"

/**
 * Classifies whether a MARKER form's current content still matches its most
 * recently imported STAPLE baseline. Never gates, dedupes, or authorizes an
 * import (docs/refactor/import.md §8.4) — purely informational.
 */
export function getImportModificationStatus(args: {
  latestImportedContentHash: string | null
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | null | undefined
}): ImportModificationStatus {
  if (!args.latestImportedContentHash?.startsWith("sha256:")) return "UNKNOWN"
  const current = hashImportedSnapshot(args.schema, args.uiSchema)
  return current === args.latestImportedContentHash ? "UNMODIFIED" : "MODIFIED"
}
