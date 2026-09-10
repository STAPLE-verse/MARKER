import { prisma } from "@/lib/db"
import { PublishedSchemaVersionDTO } from "../types"

/**
 * All published versions (pid, version, createdAt) for each given
 * `familyId`, newest first — shared by `searchPublishedSchemas` (one lookup
 * for every card on `/explore`) and `getPublishedSchemaByPid` (one family,
 * for `/schemas/[pid]`'s version-history sidebar) so a family's sibling
 * versions are computed the same way in both places.
 */
export async function getVersionsByFamilyIds(
  familyIds: string[]
): Promise<Map<string, PublishedSchemaVersionDTO[]>> {
  if (familyIds.length === 0) return new Map()

  const rows = await prisma.publishedSchema.findMany({
    where: { familyId: { in: familyIds } },
    orderBy: { createdAt: "desc" },
    select: { familyId: true, pid: true, version: true, createdAt: true },
  })

  const byFamily = new Map<string, PublishedSchemaVersionDTO[]>()
  for (const row of rows) {
    const versions = byFamily.get(row.familyId) ?? []
    versions.push({ pid: row.pid, version: row.version, createdAt: row.createdAt })
    byFamily.set(row.familyId, versions)
  }
  return byFamily
}
