import { prisma } from "@/lib/db"
import { PublishedSchemaCardDTO } from "../types"
import { mapContributorsChecked, normalizeKeywordsChecked } from "../utils/publicationMetadata"
import { getVersionsByFamilyIds } from "./publishedSchemaFamilyVersions"

const MAX_RESULTS = 200

/**
 * Public, unauthenticated listing for `/explore` — the catalog browse page.
 * No ownership scoping, same posture as `getPublishedSchemaByPid`: a
 * published schema is meant to be publicly discoverable by anyone.
 *
 * One row per `familyId` (latest version only — see
 * `docs/refactor/explore.md` §2.2): publishing a new version of a schema
 * does not delete the older published rows, so without `distinct` the same
 * schema would show once per version ever published. `distinct` + `orderBy:
 * createdAt desc` picks the most-recently-created row per family; publish
 * order is monotonic, so latest `createdAt` is always the highest version
 * for that family (no semver-aware sorting needed).
 */
export async function searchPublishedSchemas(): Promise<PublishedSchemaCardDTO[]> {
  const schemas = await prisma.publishedSchema.findMany({
    distinct: ["familyId"],
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
    select: {
      pid: true,
      title: true,
      description: true,
      version: true,
      domain: true,
      language: true,
      license: true,
      source: true,
      keywords: true,
      contributors: true,
      createdAt: true,
      familyId: true,
      author: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  // familyId only exists to look up sibling versions below — it's dropped
  // again before the DTO goes out (see §3.1: the card has no use for it
  // once dedup/grouping has happened).
  const versionsByFamily = await getVersionsByFamilyIds(schemas.map((schema) => schema.familyId))

  return schemas.map((schema) => ({
    pid: schema.pid,
    title: schema.title,
    description: schema.description,
    version: schema.version,
    domain: schema.domain,
    language: schema.language,
    license: schema.license,
    source: schema.source,
    keywords: normalizeKeywordsChecked(schema.pid, schema.keywords),
    contributors: mapContributorsChecked(schema.pid, schema.contributors),
    authorName: authorDisplayName(schema.author),
    createdAt: schema.createdAt,
    versions: versionsByFamily.get(schema.familyId) ?? [{ pid: schema.pid, version: schema.version, createdAt: schema.createdAt }],
  }))
}

function authorDisplayName(author: { firstName: string | null; lastName: string | null }): string | null {
  const name = [author.firstName, author.lastName].filter(Boolean).join(" ").trim()
  return name.length > 0 ? name : null
}
