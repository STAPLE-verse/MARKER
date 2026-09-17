import { prisma } from "@/lib/db"

/**
 * Always scoped server-side to the given user's own recipient rows. STAPLE's
 * equivalent (`getUnreadNotificationsCount`) accepts a caller-supplied
 * `where` with no injected recipient filter — a client could pass a
 * different/absent filter and read another user's counts. This takes only a
 * userId; there is no `where` parameter to smuggle a wider filter through.
 */
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { recipients: { some: { id: userId } }, read: false, source: "MARKER" },
  })
}
