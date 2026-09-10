import { prisma } from "@/lib/db"
import { PublicPublishedSchemaDTO } from "../types"
import { mapContributorsChecked, normalizeKeywordsChecked } from "../utils/publicationMetadata"
import { getVersionsByFamilyIds } from "./publishedSchemaFamilyVersions"

/**
 * Public, unauthenticated lookup for `/schemas/[pid]` — the catalog detail
 * page. No ownership scoping: a published schema's pid is meant to be
 * publicly resolvable by anyone who has it (or finds it via Explore).
 */
export async function getPublishedSchemaByPid(pid: string): Promise<PublicPublishedSchemaDTO | null> {
  const schema = await prisma.publishedSchema.findUnique({
    where: { pid },
    select: {
      pid: true,
      title: true,
      description: true,
      version: true,
      license: true,
      domain: true,
      language: true,
      keywords: true,
      contributors: true,
      releaseNotes: true,
      relatedPublicationDoi: true,
      schemaJson: true,
      uiSchema: true,
      createdAt: true,
      familyId: true,
    },
  })

  if (!schema) return null

  const versionsByFamily = await getVersionsByFamilyIds([schema.familyId])

  return {
    pid: schema.pid,
    title: schema.title,
    description: schema.description,
    version: schema.version,
    license: schema.license,
    domain: schema.domain,
    language: schema.language,
    keywords: normalizeKeywordsChecked(schema.pid, schema.keywords),
    contributors: mapContributorsChecked(schema.pid, schema.contributors),
    releaseNotes: schema.releaseNotes,
    relatedPublicationDoi: schema.relatedPublicationDoi,
    schema: (schema.schemaJson ?? {}) as Record<string, unknown>,
    uiSchema: (schema.uiSchema ?? {}) as Record<string, unknown>,
    createdAt: schema.createdAt,
    versions: versionsByFamily.get(schema.familyId) ?? [
      { pid: schema.pid, version: schema.version, createdAt: schema.createdAt },
    ],
  }
}
