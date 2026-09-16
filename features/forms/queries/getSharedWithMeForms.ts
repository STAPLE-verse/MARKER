import { prisma } from "@/lib/db"
import { FormWithLatestVersion } from "../types"
import { latestVersionArgs } from "./versionSelectors"

/**
 * Forms the user has accepted collaborator access to but does not own —
 * counterpart to `getUserForms` (owned forms). Kept as a separate query
 * rather than folded into `getUserForms` so "My Collection" semantics stay
 * unchanged; feeds the "Shared with me" collection tab
 * (docs/refactor/form-collaboration.md §4.3, §6 item 3).
 */
export async function getSharedWithMeForms(userId: number): Promise<FormWithLatestVersion[]> {
  return prisma.markerForm.findMany({
    where: {
      archived: false,
      collaborators: { some: { userId, acceptedAt: { not: null } } },
    },
    include: {
      versions: {
        ...latestVersionArgs,
        include: {
          publishedSchemas: {
            take: 1,
            select: { version: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}
