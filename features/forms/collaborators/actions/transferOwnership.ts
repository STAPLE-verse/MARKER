"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { getAcceptedCollaboratorForTransfer } from "../queries/getAcceptedCollaboratorForTransfer"
import { transferOwnershipSchema } from "../schemas"

/**
 * OWNER-only. `MarkerFormCollaborator.role` never persists `OWNER` as a value
 * (docs/refactor/form-collaboration.md §5) — this transaction upholds that
 * even mid-transfer: the new owner's collaborator row is deleted (they're now
 * represented by `ownerId` instead) and the outgoing owner's is created in
 * the same transaction, so there's never a snapshot with two owners or zero.
 * This is exactly how an owner "degrades" themselves: transfer, landing at
 * whichever role (`previousOwnerRole`) they chose.
 */
export const transferOwnership = authenticatedAction(transferOwnershipSchema, async ({ input, userId }) => {
  const { form, latestVersion } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")
  const newOwnerCollaborator = await getAcceptedCollaboratorForTransfer(input.formId, input.newOwnerUserId)

  await prisma.$transaction(async (tx) => {
    await tx.markerFormCollaborator.delete({ where: { id: newOwnerCollaborator.id } })
    await tx.markerFormCollaborator.create({
      data: {
        formId: input.formId,
        userId: form.ownerId,
        role: input.previousOwnerRole,
        // Self-initiated, not an invitation — acceptedAt is set immediately.
        invitedById: null,
        acceptedAt: new Date(),
      },
    })
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
})
