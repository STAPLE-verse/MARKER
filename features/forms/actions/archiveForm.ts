"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { formIdActionSchema } from "../schemas"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"
import { setFormArchivedState } from "../queries/setFormArchivedState"

/**
 * Soft-archives a form and cascades to all its versions (Step 1;
 * docs/form-delete-policy.md §4.3).
 */
export const archiveForm = authenticatedAction(formIdActionSchema, async ({ input, userId }) => {
  // OWNER-only (docs/refactor/form-collaboration.md §4.6) — archiving affects
  // every collaborator's access to the form, not just the caller's own edits.
  const { latestVersion } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")

  await prisma.$transaction(async (tx) => {
    await setFormArchivedState(tx, input.formId, true)
  })

  // Archived shared forms are never shown to collaborators again (docs/
  // refactor/form-collaboration.md §4.3) — this notification is the only
  // signal they get that the form vanished because it was archived, not
  // because they were removed.
  const collaborators = await prisma.markerFormCollaborator.findMany({
    where: { formId: input.formId, acceptedAt: { not: null } },
    select: { userId: true },
  })
  if (collaborators.length > 0) {
    await createNotification({
      recipients: collaborators.map((c) => c.userId),
      kind: "FORM_ARCHIVED_FOR_COLLABORATORS",
      data: { formTitle: latestVersion.name || "Untitled Draft" },
    })
  }

  revalidatePath("/collection")
  revalidatePath(`/collection/${input.formId}`)

  return { success: true }
})
