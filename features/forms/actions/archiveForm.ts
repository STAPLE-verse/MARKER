"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { formIdActionSchema } from "../schemas"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"
import { setFormArchivedState } from "../queries/setFormArchivedState"

/**
 * Soft-archives a form and cascades to all its versions (Step 1;
 * docs/form-delete-policy.md §4.3).
 */
export const archiveForm = authenticatedAction(formIdActionSchema, async ({ input, userId }) => {
  await getAuthorizedLatestVersion(input.formId, userId)

  await prisma.$transaction(async (tx) => {
    await setFormArchivedState(tx, input.formId, true)
  })

  revalidatePath("/collection")
  revalidatePath(`/collection/${input.formId}`)

  return { success: true }
})
