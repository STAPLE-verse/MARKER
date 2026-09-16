import { prisma } from "@/lib/db"
import { FormDetailDTO } from "../types"
import { mapContributors, normalizePublicationMetadata, normalizeKeywords } from "../utils/publicationMetadata"
import { getImportModificationStatus } from "../utils/importHash"

/**
 * Owner-or-collaborator-scoped form detail. Active forms return non-archived
 * versions only; archived forms return their soft-archived version history so
 * `/collection/[id]` remains openable from the Archived tab
 * (docs/form-delete-policy.md §4.3).
 *
 * Accepted collaborators (any role) can see the form (docs/refactor/
 * form-collaboration.md §4.3) — but only while it's active. Archived shared
 * forms are never shown to collaborators, not even by direct link (the
 * `archived: false` constraint on the collaborator branch below) — same
 * decision as excluding them from `getUserArchivedForms`, just closing the
 * direct-URL loophole that a list-only exclusion would leave open. The owner
 * branch has no such constraint; owners can always reach their own archived
 * forms.
 */
export async function getFormById(formId: number, userId: number): Promise<FormDetailDTO | null> {
  const form = await prisma.markerForm.findFirst({
    where: {
      id: formId,
      OR: [
        { ownerId: userId },
        { archived: false, collaborators: { some: { userId, acceptedAt: { not: null } } } },
      ],
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

  const latestVersion = versions[0]

  // Bare string, no Prisma relation (same shape as PublishedSchema.derivedFromPid
  // itself) — a second lookup, not an `include`.
  const forkedFrom =
    form.origin === "FORKED" && form.forkedFromPid
      ? await prisma.publishedSchema.findUnique({
          where: { pid: form.forkedFromPid },
          select: { pid: true, title: true },
        })
      : null

  return {
    id: form.id,
    archived: form.archived,
    hasPublishedVersion: versions.some((v) => v.publishedSchemas.length > 0),
    forkedFrom: forkedFrom ? { pid: forkedFrom.pid, title: forkedFrom.title } : null,
    stapleImport:
      form.origin === "IMPORTED_STAPLE" && form.importedFromStapleFormId
        ? {
            sourceFormId: form.importedFromStapleFormId,
            sourceVersionNumber: form.importedFromStapleVersionNumber,
            importedAt: form.importedAt,
            modificationStatus: getImportModificationStatus({
              latestImportedContentHash: form.originalImportHash,
              schema: (latestVersion?.schema ?? {}) as Record<string, unknown>,
              uiSchema: latestVersion?.uiSchema as Record<string, unknown> | null,
            }),
          }
        : null,
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
        stapleProvenance:
          v.importedFromStapleVersionNumber != null && v.importedAt
            ? {
                sourceVersionNumber: v.importedFromStapleVersionNumber,
                importedAt: v.importedAt,
                // This version's own content against its own frozen baseline —
                // valid on any version, historical or head, unlike the
                // form-level status above.
                modificationStatus: getImportModificationStatus({
                  latestImportedContentHash: v.originalImportHash,
                  schema: (v.schema ?? {}) as Record<string, unknown>,
                  uiSchema: v.uiSchema as Record<string, unknown> | null,
                }),
                isDirectImport: v.isDirectStapleImport,
              }
            : null,
      }
    }),
  }
}
