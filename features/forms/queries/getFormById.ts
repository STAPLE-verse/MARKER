import { prisma } from "@/lib/db"
import { FormDetailDTO } from "../types"
import { mapContributors, normalizePublicationMetadata, normalizeKeywords } from "../utils/publicationMetadata"

/**
 * Owner-scoped form detail. Active forms return non-archived versions only;
 * archived forms return their soft-archived version history so `/collection/[id]`
 * remains openable from the Archived tab (docs/form-delete-policy.md §4.3).
 */
export async function getFormById(formId: number, userId: number): Promise<FormDetailDTO | null> {
  const form = await prisma.markerForm.findFirst({
    where: {
      id: formId,
      ownerId: userId,
    },
  })

  if (!form) return null

  const versions = await prisma.markerFormVersion.findMany({
    where: {
      formId: form.id,
      ...(form.archived ? {} : { archived: false }),
    },
    orderBy: { version: "desc" },
    include: {
      publicationMetadata: true,
      publishedSchemas: true,
    },
  })

  return {
    id: form.id,
    archived: form.archived,
    hasPublishedVersion: versions.some((v) => v.publishedSchemas.length > 0),
    versions: versions.map((v) => {
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
        semantics: (v.semantics ?? null) as Record<string, unknown> | null,
        publicationMetadata: publicationMetadata
          ? {
              ...normalizePublicationMetadata(publicationMetadata),
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
