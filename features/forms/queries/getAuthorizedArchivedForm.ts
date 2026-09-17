import { MarkerFormCollaboratorRole, Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"
import { assertFormRole } from "./formRole"

type FormQueryClient = Pick<Prisma.TransactionClient, "markerForm">

/**
 * Write-side authorization for archived-form mutations (permanent delete,
 * unarchive; docs/form-delete-policy.md §4.3 Step 2).
 *
 * Mirrors the granular error policy of `getAuthorizedLatestVersion`, but
 * requires the form to already be archived rather than active. `minimumRole`
 * defaults to `OWNER` — every current caller (permanent delete, unarchive) is
 * OWNER-only (docs/refactor/form-collaboration.md §4.3), since an archived
 * shared form is never even visible to a collaborator to act on.
 */
export async function getAuthorizedArchivedForm(
  formId: number,
  userId: number,
  db: FormQueryClient = prisma,
  minimumRole: MarkerFormCollaboratorRole = "OWNER"
) {
  const form = await db.markerForm.findUnique({
    where: { id: formId },
    include: { collaborators: { where: { userId, acceptedAt: { not: null } } } },
  })

  if (!form) {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  assertFormRole(form, userId, minimumRole)

  if (!form.archived) {
    throw new ActionError("CONFLICT", "Archive it first")
  }

  return { form }
}
