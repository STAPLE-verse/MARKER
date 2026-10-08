"use server"

import { z } from "zod"
import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { latestVersionArgs } from "../queries/versionSelectors"

const listCopyableFormsSchema = z.object({
  // the form being edited; copying from it is what the duplicate button is for
  excludeFormId: z.number().optional(),
})

/**
 * The signed-in user's own MARKER forms, for "copy items from another form" in the
 * builder. Owned forms only: forms shared with the user are not offered.
 */
export const listCopyableForms = authenticatedAction(
  listCopyableFormsSchema,
  async ({ input, userId }) => {
    const forms = await prisma.markerForm.findMany({
      where: {
        ownerId: userId,
        archived: false,
        ...(input.excludeFormId !== undefined ? { id: { not: input.excludeFormId } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        versions: { ...latestVersionArgs, select: { name: true, version: true } },
      },
    })

    return forms.flatMap((form) => {
      const latest = form.versions[0]
      return latest
        ? [{ id: form.id, title: latest.name || "Untitled Draft", description: `v${latest.version}` }]
        : []
    })
  }
)
