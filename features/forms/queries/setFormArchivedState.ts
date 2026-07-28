import { Prisma } from "@prisma/client"

/** Atomically flips `archived` on a form and cascades to all its versions. */
export async function setFormArchivedState(
  tx: Prisma.TransactionClient,
  formId: number,
  archived: boolean
): Promise<void> {
  await tx.markerForm.update({
    where: { id: formId },
    data: { archived },
  })
  await tx.markerFormVersion.updateMany({
    where: { formId },
    data: { archived },
  })
}
