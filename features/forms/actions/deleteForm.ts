"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { deleteFormSchema } from "../schemas"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"

export const deleteForm = authenticatedAction(deleteFormSchema, async ({ input, userId }) => {
  // Verify ownership with granular errors
  await getAuthorizedLatestVersion(input.formId, userId);

  // Soft-delete the form and cascade to its versions atomically so we can never
  // end up with an archived form that still has active versions (or vice versa).
  await prisma.$transaction([
    prisma.form.update({
      where: { id: input.formId },
      data: { archived: true }
    }),
    prisma.formVersion.updateMany({
      where: { formId: input.formId },
      data: { archived: true }
    })
  ])

  revalidatePath("/collection")
  return { success: true }
})
