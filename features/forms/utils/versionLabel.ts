import { VersionStatus } from "@prisma/client"

/** Collection list badge: "Draft 2" or "Published v1.0.0". */
export function getCollectionStatusBadgeLabel(
  status: VersionStatus,
  draftVersion: number,
  publishedVersion?: string | null
): string {
  if (status === "PUBLISHED") {
    return `Published v${publishedVersion ?? draftVersion}`
  }
  return `Draft ${draftVersion}`
}
