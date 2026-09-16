"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { getAcceptedCollaboratorForTransfer } from "../queries/getAcceptedCollaboratorForTransfer"
import { transferOwnershipAndLeaveSchema } from "../schemas"

/**
 * Leaving entirely as owner (docs/refactor/form-collaboration.md §4.4) — a
 * transfer with no resulting collaborator row for the outgoing owner, done in
 * one transaction so the two steps can't race against an intervening
 * OWNER-only action from someone else in between.
 */
export const transferOwnershipAndLeave = authenticatedAction(
  transferOwnershipAndLeaveSchema,
  async ({ input, userId }) => {
    const { latestVersion } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")
    const newOwnerCollaborator = await getAcceptedCollaboratorForTransfer(input.formId, input.newOwnerUserId)

    await prisma.$transaction(async (tx) => {
      await tx.markerFormCollaborator.delete({ where: { id: newOwnerCollaborator.id } })
      await tx.markerForm.update({
        where: { id: input.formId },
        data: { ownerId: input.newOwnerUserId },
      })
    })

    const previousOwner = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
    await createNotification({
      recipients: [input.newOwnerUserId],
      kind: "FORM_OWNERSHIP_TRANSFERRED",
      data: {
        formId: input.formId,
        formTitle: latestVersion.name || "Untitled Draft",
        previousOwnerUsername: previousOwner?.username ?? "Someone",
      },
    })

    revalidatePath(`/collection/${input.formId}`)
    revalidatePath("/collection")

    return { success: true }
  }
)
