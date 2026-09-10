"use server"

import { authenticatedAction } from "@/utils/safe-action"
import { formIdActionSchema } from "../../schemas"
import { prisma } from "@/lib/db"
import { getImportModificationStatus } from "../../utils/importHash"
import type { StapleImportFormDTO } from "../queries/getStapleImportOptions"

/**
 * Scoped, on-demand version of `getStapleImportOptions` for the
 * "Update from STAPLE" button on a form's detail page: re-derives the one
 * STAPLE source form/versions for this specific, already-imported
 * MarkerForm, with `markerTargets` containing only this form (not every
 * MARKER copy of that STAPLE form — updating from here should only ever
 * target the form you're looking at). Returns `null` when the form was
 * never imported from STAPLE, or its STAPLE source is no longer available
 * (deleted/archived/reassigned to another user since import).
 */
export const getStapleSourceForUpdate = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }): Promise<StapleImportFormDTO | null> => {
    const markerForm = await prisma.markerForm.findFirst({
      where: { id: input.formId, ownerId: userId, origin: "IMPORTED_STAPLE" },
      select: {
        id: true,
        importedFromStapleFormId: true,
        importedFromStapleVersionNumber: true,
        originalImportHash: true,
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { name: true, version: true, schema: true, uiSchema: true },
        },
      },
    })
    if (!markerForm || markerForm.importedFromStapleFormId == null) return null

    const stapleForm = await prisma.form.findFirst({
      where: {
        id: markerForm.importedFromStapleFormId,
        userId,
        app: "staple",
        archived: false,
      },
      select: {
        id: true,
        versions: {
          where: { archived: false },
          orderBy: { version: "desc" },
          select: { id: true, version: true, name: true, createdAt: true },
        },
      },
    })
    if (!stapleForm || stapleForm.versions.length === 0) return null

    const head = markerForm.versions[0]

    return {
      id: stapleForm.id,
      latestName: stapleForm.versions[0].name,
      versions: stapleForm.versions.map((version) => ({
        id: version.id,
        version: version.version,
        name: version.name,
        createdAt: version.createdAt.toISOString(),
      })),
      markerTargets: [
        {
          id: markerForm.id,
          latestName: head?.name ?? "Untitled",
          latestVersion: head?.version ?? 0,
          importedSourceVersion: markerForm.importedFromStapleVersionNumber,
          modificationStatus: getImportModificationStatus({
            latestImportedContentHash: markerForm.originalImportHash,
            schema: (head?.schema ?? {}) as Record<string, unknown>,
            uiSchema: head?.uiSchema as Record<string, unknown> | null,
          }),
        },
      ],
    }
  }
)
