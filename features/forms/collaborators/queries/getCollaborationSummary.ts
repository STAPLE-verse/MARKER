import { prisma } from "@/lib/db"
import type { CollaboratorDTO } from "../types"
import { getFormCollaborators } from "./getFormCollaborators"

export interface CollaborationSummaryDTO {
  ownerId: number
  ownerUsername: string
  ownerAvatarEmail: string | null
  collaborators: CollaboratorDTO[]
}

/**
 * Everything the collaborator management modal and the header's avatar stack
 * need about who has access to a form (docs/refactor/form-collaboration.md §6
 * items 1 and 4) — the owner (always `MarkerForm.ownerId`, never a
 * collaborator row) plus the unified pending/accepted collaborator list.
 */
export async function getCollaborationSummary(formId: number, ownerId: number): Promise<CollaborationSummaryDTO> {
  const [owner, collaborators] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { username: true, email: true, gravatar: true },
    }),
    getFormCollaborators(formId),
  ])

  return {
    ownerId,
    ownerUsername: owner.username,
    ownerAvatarEmail: owner.gravatar || owner.email,
    collaborators,
  }
}
