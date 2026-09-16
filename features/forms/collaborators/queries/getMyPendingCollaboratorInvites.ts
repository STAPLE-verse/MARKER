import { prisma } from "@/lib/db"
import { latestVersionArgs } from "../../queries/versionSelectors"
import type { PendingCollaboratorInviteDTO } from "../types"

/**
 * Feeds the dashboard invitations card (docs/refactor/form-collaboration.md
 * §6 item 2) — every invite this user hasn't yet accepted or declined.
 */
export async function getMyPendingCollaboratorInvites(
  userId: number
): Promise<PendingCollaboratorInviteDTO[]> {
  const rows = await prisma.markerFormCollaborator.findMany({
    where: { userId, acceptedAt: null },
    include: {
      form: { include: { versions: latestVersionArgs } },
    },
    orderBy: { invitedAt: "desc" },
  })

  // `invitedById` is a bare scalar FK, not a Prisma relation (same shape as
  // `MarkerForm.forkedFromPid` — see schema.prisma) — a second query, not an
  // `include`.
  const inviterIds = [...new Set(rows.map((r) => r.invitedById).filter((id): id is number => id != null))]
  const inviters = inviterIds.length
    ? await prisma.user.findMany({ where: { id: { in: inviterIds } }, select: { id: true, username: true } })
    : []
  const inviterUsernameById = new Map(inviters.map((u) => [u.id, u.username]))

  return rows.map((row) => ({
    collaboratorId: row.id,
    formId: row.formId,
    formTitle: row.form.versions[0]?.name || "Untitled Draft",
    role: row.role as "EDITOR" | "VIEWER",
    inviterUsername: (row.invitedById != null && inviterUsernameById.get(row.invitedById)) || "Someone",
    invitedAt: row.invitedAt,
  }))
}
