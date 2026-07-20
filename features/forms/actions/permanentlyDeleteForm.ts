"use server"

import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { formIdActionSchema } from "../schemas"
import { withLockedAuthorizedArchivedForm } from "../queries/formVersionConcurrency"

/**
 * Hard-deletes an archived form that has never produced a PublishedSchema.
 * See docs/form-delete-policy.md §4.3 Step 2.
 */
export const permanentlyDeleteForm = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }) => {
    await withLockedAuthorizedArchivedForm(input.formId, userId, async (tx) => {
      const versionWithPublishedSchema = await tx.markerFormVersion.findFirst({
        where: {
          formId: input.formId,
          publishedSchemas: { some: {} },
        },
        select: { id: true },
      })

      if (versionWithPublishedSchema) {
        throw new ActionError(
          "CONFLICT",
          "This form has published schemas and cannot be permanently deleted."
        )
      }

      await tx.markerForm.delete({
        where: { id: input.formId },
      })
    })

    revalidatePath("/collection")

    return { success: true }
  }
)
