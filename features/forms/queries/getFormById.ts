import { prisma } from "@/lib/db"
import { FormDetailDTO } from "../types"
import { nonArchivedVersionsArgs } from "./versionSelectors"
import { mapContributors, normalizeCatalogMetadata, normalizeKeywords } from "../utils/catalogMetadata"

export async function getFormById(formId: number, userId: number): Promise<FormDetailDTO | null> {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      userId,
      app: "marker",
      archived: false
    },
    include: {
      versions: {
        ...nonArchivedVersionsArgs,
        include: {
          publicationMetadata: true,
          publishedSchemas: true,
        }
      }
    }
  })

  if (!form) return null

  return {
    id: form.id,
    versions: form.versions.map((v) => {
      const published = v.publishedSchemas[0] ?? null
      const publicationMetadata = v.publicationMetadata
      return {
        id: v.id,
        name: v.name,
        version: v.version,
        status: v.status,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        schema: (v.schema ?? {}) as Record<string, unknown>,
        uiSchema: (v.uiSchema ?? {}) as Record<string, unknown>,
        publicationMetadata: publicationMetadata
          ? {
              ...normalizeCatalogMetadata(publicationMetadata),
              updatedAt: publicationMetadata.updatedAt,
            }
          : null,
        publishedSchema: published
          ? {
              pid: published.pid,
              version: published.version,
              license: published.license,
              domain: published.domain,
              language: published.language,
              releaseNotes: published.releaseNotes,
              keywords: normalizeKeywords(published.keywords),
              contributors: mapContributors(published.contributors),
            }
          : null,
      }
    }),
  }
}
