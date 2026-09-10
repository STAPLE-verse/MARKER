import { prisma } from "@/lib/db"
import { UserPublishedSchemaDTO } from "../types"

/**
 * One row per family — the user's most recently published version of each
 * schema family they've ever published, newest publish first. Mirrors
 * `/explore`'s "one row per familyId, latest version" convention rather than
 * listing every historical version, which would repeat the same title once
 * per republish.
 *
 * Deliberately sourced from `PublishedSchema` directly, not `MarkerForm`'s
 * current draft status: a family stays "published" here even after the user
 * starts a newer, not-yet-published draft on top of it (which would otherwise
 * make `getUserForms`'s latest-version status read back as DRAFT).
 */
export async function getUserPublishedSchemas(userId: number): Promise<UserPublishedSchemaDTO[]> {
  const rows = await prisma.publishedSchema.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { pid: true, title: true, version: true, familyId: true, createdAt: true },
  })

  const latestByFamily = new Map<string, UserPublishedSchemaDTO>()
  for (const row of rows) {
    if (!latestByFamily.has(row.familyId)) {
      latestByFamily.set(row.familyId, {
        pid: row.pid,
        title: row.title,
        version: row.version,
        createdAt: row.createdAt,
      })
    }
  }

  return Array.from(latestByFamily.values())
}
