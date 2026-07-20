import { prisma } from "@/lib/db"
import { FormWithLatestVersion } from "../types"
import { latestVersionArgs } from "./versionSelectors"

export async function getUserForms(userId: number): Promise<FormWithLatestVersion[]> {
  return prisma.markerForm.findMany({
    where: { 
      ownerId: userId,
      archived: false 
    },
    include: {
      versions: latestVersionArgs
    },
    orderBy: { updatedAt: 'desc' }
  })
}
