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
  // OWNER-only (docs/refactor/form-collaboration.md §4.6) — archiving affects
  // every collaborator's access to the form, not just the caller's own edits.
  await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")

  await prisma.$transaction(async (tx) => {
    await setFormArchivedState(tx, input.formId, true)
  })

  revalidatePath("/collection")
  revalidatePath(`/collection/${input.formId}`)

  return { success: true }
})
