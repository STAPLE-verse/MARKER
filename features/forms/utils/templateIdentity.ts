import { CORE_PROFILE_URI, SEMANTIC_PROFILE_URI } from "@staple-verse/marker-template-runtime"

/**
 * The non-storage part of the identity rule (see linear-coalescing-crescent.md
 * "Identity rule" section). `familyId` and the draft-phase `versionId` are
 * stored opaque values (`generatePID("mf")`/`generatePID("mv")`, minted once
 * in the mutating actions) — this module only wraps them into the URI shape
 * marker-template-spec's schema requires (`format: "uri"`), and derives the
 * two values that are pure functions of already-stored data.
 */

const DEFAULT_ORIGIN = "http://localhost:3000"

function origin(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const resolved = value ? value : DEFAULT_ORIGIN
  return resolved.replace(/\/+$/, "")
}

/** Wraps the opaque, stored `MarkerForm.familyId` into a URI. Stable forever — never re-wrapped differently. */
export function familyIdFor(familyId: string): string {
  return `urn:marker:family:${familyId}`
}

/** Wraps the opaque, stored `MarkerFormVersion.versionId` into a URI while the version is DRAFT. */
export function draftVersionIdFor(versionId: string): string {
  return `urn:marker:draft-version:${versionId}`
}

/**
 * The permanent `versionId` once a version is PUBLISHED — derived from the
 * already-opaque `PublishedSchema.pid`, not a new generated value.
 */
export function publishedVersionIdFor(pid: string): string {
  return `${origin()}/schemas/${pid}`
}

/** Core V1 profile always included; Semantic V1 included exactly when semantics is present. */
export function conformsToFor(hasSemantics: boolean): string[] {
  return hasSemantics ? [CORE_PROFILE_URI, SEMANTIC_PROFILE_URI] : [CORE_PROFILE_URI]
}
