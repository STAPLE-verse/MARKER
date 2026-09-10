import { prisma } from "@/lib/db"
import { getUserForms } from "@/features/forms/queries/getUserForms"
import { DashboardStatsDTO } from "../types"

/**
 * Reuses the exact same source query as `/collection`'s "owned" tab
 * (`getUserForms`) and the exact same status classification
 * (`latestVersion?.status ?? "DRAFT"`, matching `collection/page.tsx`'s
 * `mapFormsToRows`) rather than deriving these counts a different way. This
 * guarantees the dashboard's numbers can never drift from what the user sees
 * on their Collection page.
 */
export async function getDashboardStats(userId: number): Promise<DashboardStatsDTO> {
  const [forms, archivedCount] = await Promise.all([
    getUserForms(userId),
    // Same `{ ownerId, archived: true }` filter as the Collection page's
    // Archived tab (`getUserArchivedForms`) — a plain count instead of that
    // query's full version include, since this only needs a number.
    prisma.markerForm.count({ where: { ownerId: userId, archived: true } }),
  ])

  let publishedCount = 0
  let draftCount = 0
  for (const form of forms) {
    const status = form.versions[0]?.status ?? "DRAFT"
    if (status === "PUBLISHED") {
      publishedCount++
    } else {
      draftCount++
    }
  }

  return { publishedCount, draftCount, archivedCount }
}
