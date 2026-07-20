import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"

type FormQueryClient = Pick<Prisma.TransactionClient, "markerForm">

/**
 * Write-side authorization for permanent delete of an archived form
 * (docs/form-delete-policy.md §4.3 Step 2).
 *
 * Mirrors the granular error policy of `getAuthorizedLatestVersion`, but
 * requires the form to already be archived rather than active.
 */
export async function getAuthorizedArchivedForm(
  formId: number,
  userId: number,
  db: FormQueryClient = prisma
) {
  const form = await db.markerForm.findUnique({
    where: { id: formId },
  })

  if (!form) {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  if (form.ownerId !== userId) {
    throw new ActionError("FORBIDDEN", "You do not have permission to modify this form")
  }

  if (!form.archived) {
    throw new ActionError("CONFLICT", "Archive it first")
  }

  return { form }
}
