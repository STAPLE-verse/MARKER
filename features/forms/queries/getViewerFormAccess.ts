import { prisma } from "@/lib/db"
import { resolveFormRole } from "./formRole"

/**
 * This viewer's current, real access to a form — owner or an accepted
 * collaborator, any role — or `null` if they have neither.
 *
 * Exists specifically so `/schemas/[pid]` doesn't have to infer draft access
 * from `PublishedSchema.authorId`, which is frozen at publish time: it
 * correctly follows an ownership transfer (the new owner has full draft
 * access even though `authorId` still names whoever clicked "Publish"
 * originally), and it recognizes every accepted collaborator, not just the
 * original publisher.
 */
export async function getViewerFormAccess(formId: number, userId: number) {
  const form = await prisma.markerForm.findUnique({
    where: { id: formId },
    select: {
      ownerId: true,
      collaborators: { where: { userId, acceptedAt: { not: null } }, select: { role: true } },
    },
  })
  if (!form) return null
  return resolveFormRole(form, userId)
}
