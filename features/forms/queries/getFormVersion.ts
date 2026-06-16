import { prisma } from "@/lib/db"
import { FormVersion } from "@prisma/client"

export async function getFormVersion(formVersionId: number): Promise<FormVersion | null> {
  return prisma.formVersion.findUnique({
    where: { 
      id: formVersionId,
      archived: false
    }
  })
}
