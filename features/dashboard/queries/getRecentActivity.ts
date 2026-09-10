import { prisma } from "@/lib/db"
import { latestVersionArgs } from "@/features/forms/queries/versionSelectors"
import { ActivityItemDTO } from "../types"

const RECENT_ACTIVITY_LIMIT = 8

/**
 * Builds the dashboard's Recent Activity feed from four independent,
 * unambiguous timestamp sources — there's no dedicated activity-log table.
 * Deliberately does NOT surface every `MarkerFormVersion` creation (new
 * checkpoints, restores): those are routine edit-history detail already
 * covered by a form's own Version History sidebar, and including them here
 * would bury the events below in noise for no MVP benefit.
 */
export async function getRecentActivity(userId: number): Promise<ActivityItemDTO[]> {
  const [published, created, imported, forked] = await Promise.all([
    prisma.publishedSchema.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
      select: {
        pid: true,
        title: true,
        version: true,
        createdAt: true,
        originFormVersion: { select: { formId: true } },
      },
    }),
    prisma.markerForm.findMany({
      where: { ownerId: userId, origin: "NATIVE", archived: false },
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
      include: { versions: latestVersionArgs },
    }),
    prisma.markerForm.findMany({
      where: { ownerId: userId, origin: "IMPORTED_STAPLE", archived: false, importedAt: { not: null } },
      orderBy: { importedAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
      include: { versions: latestVersionArgs },
    }),
    prisma.markerForm.findMany({
      where: { ownerId: userId, origin: "FORKED", archived: false, forkedAt: { not: null } },
      orderBy: { forkedAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
      include: { versions: latestVersionArgs },
    }),
  ])

  const items: ActivityItemDTO[] = [
    ...published.map((p) => ({
      type: "PUBLISHED" as const,
      title: p.title,
      version: p.version,
      timestamp: p.createdAt,
      // Falls back to the public catalog page on the rare row whose origin
      // draft has since been deleted (originFormVersionId is onDelete: SetNull).
      href: p.originFormVersion?.formId != null ? `/collection/${p.originFormVersion.formId}` : `/schemas/${p.pid}`,
    })),
    ...created.map((f) => ({
      type: "CREATED" as const,
      title: f.versions[0]?.name || "Untitled Draft",
      version: null,
      timestamp: f.createdAt,
      href: `/collection/${f.id}`,
    })),
    ...imported.map((f) => ({
      type: "IMPORTED_STAPLE" as const,
      title: f.versions[0]?.name || "Untitled Draft",
      version: null,
      // Non-null by the `importedAt: { not: null }` filter above.
      timestamp: f.importedAt as Date,
      href: `/collection/${f.id}`,
    })),
    ...forked.map((f) => ({
      type: "FORKED" as const,
      title: f.versions[0]?.name || "Untitled Draft",
      version: null,
      // Non-null by the `forkedAt: { not: null }` filter above.
      timestamp: f.forkedAt as Date,
      href: `/collection/${f.id}`,
    })),
  ]

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return items.slice(0, RECENT_ACTIVITY_LIMIT)
}
