import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"

/**
 * Shared validation for `transferOwnership`/`transferOwnershipAndLeave`:
 * ownership can only move to an existing, accepted collaborator — never to an
 * outsider (invite them first) or a still-pending invite (docs/refactor/
 * form-collaboration.md §4.4).
 */
export async function getAcceptedCollaboratorForTransfer(formId: number, newOwnerUserId: number) {
  const collaborator = await prisma.markerFormCollaborator.findUnique({
    where: { formId_userId: { formId, userId: newOwnerUserId } },
  })
  if (!collaborator || !collaborator.acceptedAt) {
    throw new ActionError(
      "CONFLICT",
      "You can only transfer ownership to an existing, accepted collaborator."
    )
  }
  return collaborator
}
