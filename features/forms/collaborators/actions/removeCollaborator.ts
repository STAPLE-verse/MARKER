"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { assertFormRole } from "../../queries/formRole"
import { latestVersionArgs } from "../../queries/versionSelectors"
import { collaboratorIdActionSchema } from "../schemas"

/**
 * OWNER-only removal of someone else, or self-removal ("leave this form") —
 * also doubles as "cancel invite" when called on a pending row, since
 * deleting an unaccepted row and revoking an accepted one are the same
 * operation on the same table (docs/refactor/form-collaboration.md §4.4). Not
 * callable by the current owner on themself — the owner has no collaborator
 * row to remove; see `transferOwnership`.
 */
export const removeCollaborator = authenticatedAction(collaboratorIdActionSchema, async ({ input, userId }) => {
  const collaborator = await prisma.markerFormCollaborator.findUnique({
    where: { id: input.collaboratorId },
    include: {
      form: {
        include: {
          collaborators: { where: { userId, acceptedAt: { not: null } } },
          versions: latestVersionArgs,
        },
      },
    },
  })

  if (!collaborator || collaborator.formId !== input.formId) {
    throw new ActionError("NOT_FOUND", "Collaborator not found")
  }

  const isSelf = collaborator.userId === userId
  if (!isSelf) {
    assertFormRole(collaborator.form, userId, "OWNER", "You do not have permission to remove this collaborator")
  }

  await prisma.markerFormCollaborator.delete({ where: { id: input.collaboratorId } })

  // Skip notifying about a cancelled invite the recipient never accepted —
  // there's no access to explain the loss of.
  if (collaborator.acceptedAt !== null) {
    const actingUser = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
    await createNotification({
      recipients: [collaborator.userId],
      kind: "FORM_COLLABORATOR_REMOVED",
      data: {
        formTitle: collaborator.form.versions[0]?.name || "Untitled Draft",
        initiatedBySelf: isSelf,
        actorUsername: actingUser?.username ?? "Someone",
      },
    })
  }

  revalidatePath(`/collection/${input.formId}`)
  revalidatePath("/collection")

  return { success: true }
})
