"use server"

import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { formIdActionSchema } from "../schemas"
import { withLockedAuthorizedArchivedForm } from "../queries/formVersionConcurrency"
import { setFormArchivedState } from "../queries/setFormArchivedState"

/**
 * Restores an archived form and all its versions to the active collection
 * (inverse of `archiveForm`; docs/form-delete-policy.md §4.3 Step 1).
 */
export const unarchiveForm = authenticatedAction(formIdActionSchema, async ({ input, userId }) => {
  await withLockedAuthorizedArchivedForm(input.formId, userId, async (tx) => {
    await setFormArchivedState(tx, input.formId, false)
  })

  revalidatePath("/collection")
  revalidatePath(`/collection/${input.formId}`)

  return { success: true }
})
