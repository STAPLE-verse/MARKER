import { prisma } from "@/lib/db"
import type { CollaboratorDTO } from "../types"

/**
 * All `MarkerFormCollaborator` rows for a form, pending and accepted alike —
 * the management modal renders both in one list (docs/refactor/
 * form-collaboration.md §6 item 1). Callers are responsible for their own
 * access check (`getAuthorizedLatestVersion(..., "VIEWER")`); this query does
 * no authorization itself.
 */
export async function getFormCollaborators(formId: number): Promise<CollaboratorDTO[]> {
  const rows = await prisma.markerFormCollaborator.findMany({
    where: { formId },
    include: {
      user: {
        select: { username: true, firstName: true, lastName: true, email: true, gravatar: true },
      },
    },
    orderBy: { invitedAt: "asc" },
  })

  return rows.map((row) => ({
    collaboratorId: row.id,
    userId: row.userId,
    username: row.user.username,
    name: [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") || null,
    avatarEmail: row.user.gravatar || row.user.email,
    // Structurally never "OWNER" (docs/refactor/form-collaboration.md §5).
    role: row.role as "EDITOR" | "VIEWER",
    isPending: row.acceptedAt === null,
    invitedAt: row.invitedAt,
  }))
}
