import { prisma } from "@/lib/db"
import { FormWithLatestVersion } from "../types"
import { latestVersionAnyArgs } from "./versionSelectors"

/**
 * Owner's soft-archived forms for the collection `?tab=archived` view
 * (docs/form-delete-policy.md §4.3).
 */
export async function getUserArchivedForms(userId: number): Promise<FormWithLatestVersion[]> {
  return prisma.markerForm.findMany({
    where: {
      ownerId: userId,
      archived: true,
    },
    include: {
      versions: {
        ...latestVersionAnyArgs,
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
