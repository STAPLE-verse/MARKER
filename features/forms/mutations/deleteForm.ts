"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { deleteFormSchema } from "../schemas"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"

export const deleteForm = authenticatedAction(deleteFormSchema, async ({ input, userId }) => {
  // Verify ownership with granular errors
  await getAuthorizedLatestVersion(input.formId, userId);

  // Soft delete the form
  await prisma.form.update({
    where: { id: input.formId },
    data: { archived: true }
  })

  // Also soft delete all versions
  await prisma.formVersion.updateMany({
    where: { formId: input.formId },
    data: { archived: true }
  })

  revalidatePath("/collection")
  return { success: true }
})
