import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"

export async function getAuthorizedLatestVersion(formId: number, userId: number) {
  // We fetch strictly by ID first so we can give granular, helpful error messages
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
  })

  // 1. Check existence
  if (!form) {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  // 2. Check ownership (Granular Error)
  if (form.userId !== userId) {
    throw new ActionError("FORBIDDEN", "You do not have permission to edit this form")
  }

  // 3. Enforce tenancy boundary silently (If it's a STAPLE form, pretend it doesn't exist here)
  if (form.app !== "marker") {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  // 4. Check archived state
  if (form.archived) {
    throw new ActionError("CONFLICT", "Cannot edit an archived form")
  }

  // 5. Ensure valid state
  if (form.versions.length === 0) {
    throw new ActionError("CONFLICT", "Form data is corrupted (no versions found)")
  }

  return { form, latestVersion: form.versions[0] }
}
