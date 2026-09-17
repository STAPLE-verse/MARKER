"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { inviteCollaboratorSchema } from "../schemas"

export const inviteCollaborator = authenticatedAction(inviteCollaboratorSchema, async ({ input, userId }) => {
  const { form, latestVersion } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")

  if (input.inviteeUserId === form.ownerId) {
    throw new ActionError("CONFLICT", "This user already owns the form.")
  }

  const invitee = await prisma.user.findUnique({
    where: { id: input.inviteeUserId },
    select: { id: true, username: true },
  })
  if (!invitee) {
    throw new ActionError("NOT_FOUND", "User not found")
  }

  // `@@unique([formId, userId])` would also catch this at the DB level — a
  // friendly pre-check gives a clearer message than a raw constraint error.
  const existing = await prisma.markerFormCollaborator.findUnique({
    where: { formId_userId: { formId: input.formId, userId: input.inviteeUserId } },
  })
  if (existing) {
    throw new ActionError(
      "CONFLICT",
      existing.acceptedAt ? "This user is already a collaborator." : "This user has already been invited."
    )
  }

  const created = await prisma.markerFormCollaborator.create({
    data: {
      formId: input.formId,
      userId: input.inviteeUserId,
      role: input.role,
      invitedById: userId,
    },
    select: { id: true, invitedAt: true },
  })

  const inviter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })

  await createNotification({
    recipients: [input.inviteeUserId],
    kind: "FORM_COLLABORATOR_INVITED",
    data: {
      inviterUsername: inviter?.username ?? "Someone",
      formTitle: latestVersion.name || "Untitled Draft",
      role: input.role,
    },
  })

  revalidatePath(`/collection/${input.formId}`)

  // Returned so the invite-search UI can append the new row to its own
  // optimistic list without a round trip through `getFormCollaborators`.
  return { success: true, collaboratorId: created.id, invitedAt: created.invitedAt.toISOString() }
})
