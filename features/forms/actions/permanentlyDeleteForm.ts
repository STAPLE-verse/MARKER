"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { permanentlyDeleteFormSchema } from "../schemas"
import { getAuthorizedArchivedForm } from "../queries/getAuthorizedArchivedForm"

/**
 * Hard-deletes an archived form that has never produced a PublishedSchema.
 * See docs/form-delete-policy.md §4.3 Step 2.
 */
export const permanentlyDeleteForm = authenticatedAction(
  permanentlyDeleteFormSchema,
  async ({ input, userId }) => {
    await getAuthorizedArchivedForm(input.formId, userId)

    const versionWithPublishedSchema = await prisma.markerFormVersion.findFirst({
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

    await prisma.markerForm.delete({
      where: { id: input.formId },
    })

    revalidatePath("/collection")

    return { success: true }
  }
)
