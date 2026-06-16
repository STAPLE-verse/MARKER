import { prisma } from "@/lib/db"
import { FormWithAllVersions } from "../types"

export async function getFormById(formId: number, userId: number): Promise<FormWithAllVersions | null> {
  return prisma.form.findFirst({
    where: { 
      id: formId,
      userId,
      app: "marker",
      archived: false
    },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        where: { archived: false }
      }
    }
  })
}
