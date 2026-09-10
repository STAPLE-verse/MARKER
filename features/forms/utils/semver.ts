// Matches publishReviewSchema's version pattern in schemas.ts (rejects
// leading zeros, e.g. "01.2.3") — kept in sync by hand for now; see that
// schema's own comment on delegating spec-shape rules to the runtime
// validator instead of hand-mirroring them.
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

interface ParsedSemver {
  major: number
  minor: number
  patch: number
}

function parseSemver(version: string): ParsedSemver | null {
  const match = SEMVER_PATTERN.exec(version)
  if (!match) return null
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

function compareSemver(a: ParsedSemver, b: ParsedSemver): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  return a.patch - b.patch
}

/**
 * Suggests the next version to publish: the current highest published
 * version's patch bumped by one, or "1.0.0" for a family with no published
 * versions yet. Unparseable entries (legacy rows predating today's version
 * pattern) are ignored rather than breaking the suggestion — same
 * don't-let-stale-data-break-the-read-path stance as
 * publicationMetadata.ts's `*Checked` wrappers.
 */
export function suggestNextVersion(publishedVersions: string[]): string {
  const parsed = publishedVersions
    .map(parseSemver)
    .filter((version): version is ParsedSemver => version !== null)
  if (parsed.length === 0) return "1.0.0"

  const highest = parsed.reduce((max, current) => (compareSemver(current, max) > 0 ? current : max))
  return `${highest.major}.${highest.minor}.${highest.patch + 1}`
}
