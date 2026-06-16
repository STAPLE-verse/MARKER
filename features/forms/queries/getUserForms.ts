import { prisma } from "@/lib/db"
import { FormWithLatestVersion } from "../types"

export async function getUserForms(userId: number): Promise<FormWithLatestVersion[]> {
  return prisma.form.findMany({
    where: { 
      userId, 
      app: "marker",
      archived: false 
    },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}
