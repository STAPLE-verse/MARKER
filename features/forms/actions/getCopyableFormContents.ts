"use server"

import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { formIdActionSchema } from "../schemas"
import { latestVersionArgs } from "../queries/versionSelectors"

/**
 * The latest schema of one of the signed-in user's own MARKER forms. Anyone else's form
 * is reported as not found, so ids can't be probed.
 */
export const getCopyableFormContents = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }) => {
    const form = await prisma.markerForm.findFirst({
      where: { id: input.formId, ownerId: userId, archived: false },
      select: {
        versions: { ...latestVersionArgs, select: { schema: true, uiSchema: true } },
      },
    })

    const latest = form?.versions[0]
    if (!latest) throw new ActionError("NOT_FOUND", "That form could not be found.")

    return {
      schema: latest.schema as Record<string, unknown>,
      uiSchema: (latest.uiSchema ?? null) as Record<string, unknown> | null,
    }
  }
)
