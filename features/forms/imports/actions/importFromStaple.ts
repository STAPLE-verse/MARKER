"use server"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { generatePID } from "@/utils/id"
import { importFromStapleSchema } from "../../schemas"
import { withLockedAuthorizedLatestVersion } from "../../queries/formVersionConcurrency"
import { resolveStapleSource } from "../resolveStapleSource"
import { getImportModificationStatus, hashImportedSnapshot } from "../../utils/importHash"
import { assembleDraftPackage, formatDiagnosticsForUser, validateTemplatePackage } from "../../utils/templatePackage"
import {
  assembleContributorName,
  copyPublicationMetadataFields,
  DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
  DEFAULT_PUBLICATION_METADATA,
} from "../../utils/publicationMetadata"

function assertConforms(args: {
  familyId: string
  versionId: string
  title: string
  source: { schema: Record<string, unknown>; uiSchema: Record<string, unknown> | null; semantics: unknown }
}) {
  const draftPackage = assembleDraftPackage({
    familyId: args.familyId,
    versionId: args.versionId,
    // Draft packages don't require semver — this call only runs structural
    // validation and is never persisted.
    version: "1",
    title: args.title,
    schema: args.source.schema,
    uiSchema: args.source.uiSchema,
    semantics: args.source.semantics,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const diagnostics = validateTemplatePackage(draftPackage)
  if (diagnostics.length > 0) {
    throw new ActionError(
      "VALIDATION",
      `This STAPLE form doesn't meet MARKER's template requirements (${formatDiagnosticsForUser(diagnostics)}). Ask the form owner to fix it in STAPLE, or import it and edit it in MARKER's builder first.`
    )
  }
}

export const importFromStaple = authenticatedAction(importFromStapleSchema, async ({ input, userId }) => {
  // Resolved before any lock is taken (docs/refactor/import.md §8.5: "Resolve
  // source content before opening the write transaction").
  const source = await resolveStapleSource(input.sourceFormId, input.sourceVersionId, userId)
  const title = source.title || (source.schema.title as string | undefined) || "Untitled imported schema"
  const importedContentHash = hashImportedSnapshot(source.schema, source.uiSchema)
  // Shared between the MarkerForm's (mutable, latest-only) fields and this
  // version's own (frozen) fields, so both record exactly the same instant.
  const importedAt = new Date()

  if (input.mode === "create") {
    const familyId = generatePID("mf")
    const versionId = generatePID("mv")

    assertConforms({ familyId, versionId, title, source })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, orcid: true },
    })
    const authorName = assembleContributorName({
      nameType: "Personal",
      givenName: user?.firstName ?? undefined,
      familyName: user?.lastName ?? undefined,
    })

    const form = await prisma.markerForm.create({
      data: {
        ownerId: userId,
        familyId,
        origin: "IMPORTED_STAPLE",
        importedFromStapleFormId: source.sourceFormId,
        importedFromStapleVersionNumber: source.sourceVersionNumber,
        importedAt,
        originalImportHash: importedContentHash,
        versions: {
          create: {
            name: title,
            version: 1,
            schema: source.schema as Prisma.InputJsonValue,
            uiSchema: (source.uiSchema ?? {}) as Prisma.InputJsonValue,
            semantics: (source.semantics ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            versionId,
            // This version row IS the import event — fresh values, not
            // copied forward from anything (see schema.prisma).
            importedFromStapleVersionNumber: source.sourceVersionNumber,
            importedAt,
            originalImportHash: importedContentHash,
            publicationMetadata: {
              create: copyPublicationMetadataFields({
                ...DEFAULT_PUBLICATION_METADATA,
                contributors: authorName
                  ? [{
                      name: authorName,
                      nameType: "Personal",
                      givenName: user?.firstName ?? undefined,
                      familyName: user?.lastName ?? undefined,
                      roles: [DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE, "Creator"],
                      orcid: user?.orcid ?? "",
                    }]
                  : [],
              }),
            },
          },
        },
      },
    })

    revalidatePath("/collection")
    return { formId: form.id, mode: "create" as const }
  }

  // mode === "update"
  const result = await withLockedAuthorizedLatestVersion(
    input.targetMarkerFormId,
    userId,
    async (tx, { form, latestVersion }) => {
      if (form.origin !== "IMPORTED_STAPLE" || form.importedFromStapleFormId !== source.sourceFormId) {
        throw new ActionError(
          "CONFLICT",
          "This MARKER form was not imported from the selected STAPLE form."
        )
      }

      // Recomputed fresh against the locked, current head — never trust the
      // picker page's DTO, which may be stale by the time of submission
      // (docs/refactor/staple-import-phase3.md §6a).
      const currentStatus = getImportModificationStatus({
        latestImportedContentHash: form.originalImportHash,
        schema: (latestVersion.schema ?? {}) as Record<string, unknown>,
        uiSchema: latestVersion.uiSchema as Record<string, unknown> | null,
      })
      if (currentStatus === "MODIFIED" && !input.confirmOverwrite) {
        throw new ActionError(
          "CONFLICT",
          "This MARKER form has local changes since the last import. Confirm to overwrite them with the STAPLE update."
        )
      }

      const versionId = generatePID("mv")
      assertConforms({ familyId: form.familyId, versionId, title, source })

      const latestMetadata = await tx.publicationMetadata.findUnique({
        where: { formVersionId: latestVersion.id },
      })

      const newVersion = await tx.markerFormVersion.create({
        data: {
          formId: form.id,
          version: latestVersion.version + 1,
          name: title,
          schema: source.schema as Prisma.InputJsonValue,
          uiSchema: (source.uiSchema ?? {}) as Prisma.InputJsonValue,
          semantics: (source.semantics ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          versionId,
          // This version row IS the import event — fresh values, not
          // copied forward from the previous head (see schema.prisma).
          importedFromStapleVersionNumber: source.sourceVersionNumber,
          importedAt,
          originalImportHash: importedContentHash,
          // Preserve MARKER's own curated publication metadata across an
          // update-import — STAPLE never overwrites it (import.md §8.6).
          publicationMetadata: {
            create: copyPublicationMetadataFields(latestMetadata ?? DEFAULT_PUBLICATION_METADATA),
          },
        },
      })

      await tx.markerForm.update({
        where: { id: form.id },
        data: {
          importedFromStapleVersionNumber: source.sourceVersionNumber,
          importedAt,
          originalImportHash: importedContentHash,
        },
      })

      return newVersion
    }
  )

  revalidatePath(`/collection/${input.targetMarkerFormId}`)
  revalidatePath(`/collection/${input.targetMarkerFormId}/edit`)
  revalidatePath("/collection")
  return { formId: input.targetMarkerFormId, version: result.version, mode: "update" as const }
})
