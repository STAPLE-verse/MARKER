import { prisma } from "@/lib/db"
import { FormWithLatestVersion } from "../types"
import { latestVersionArgs } from "./versionSelectors"

export async function getUserForms(userId: number): Promise<FormWithLatestVersion[]> {
  return prisma.form.findMany({
    where: { 
      userId, 
      app: "marker",
      archived: false 
    },
    include: {
      versions: latestVersionArgs
    },
    orderBy: { updatedAt: 'desc' }
  })
}
