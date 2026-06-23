import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"
import { latestVersionArgs } from "./versionSelectors"

/**
 * Write-side authorization helper (architecture.md §8.10).
 *
 * Unlike the read-side, filter-and-null queries (`getFormById`/`getUserForms`),
 * this fetches strictly by ID and then runs granular guard clauses, throwing a
 * coded `ActionError` for each failure mode. This is the single entry point for
 * authorizing mutations, so the FORBIDDEN-vs-NOT_FOUND policy lives here only.
 */
export async function getAuthorizedLatestVersion(formId: number, userId: number) {
  // We fetch strictly by ID first so we can give granular, helpful error messages
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { versions: latestVersionArgs }
  })

  // 1. Check existence
  if (!form) {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  // 2. Check ownership.
  //    DELIBERATE: we return FORBIDDEN (not NOT_FOUND) when the form exists but
  //    belongs to someone else. This is a more helpful error for the (only)
  //    callers of this helper — authenticated owners hitting their own forms via
  //    the UI — and accepts the minor trade-off that it confirms a form id
  //    exists to a signed-in user who isn't the owner. The read-side queries do
  //    the opposite (collapse everything to not-found) because anonymous/list
  //    surfaces must not leak existence. See architecture.md §8.10.
  if (form.userId !== userId) {
    throw new ActionError("FORBIDDEN", "You do not have permission to modify this form")
  }

  // 3. Enforce tenancy boundary silently (If it's a STAPLE form, pretend it doesn't exist here)
  if (form.app !== "marker") {
    throw new ActionError("NOT_FOUND", "Form not found")
  }

  // 4. Check archived state
  if (form.archived) {
    throw new ActionError("CONFLICT", "Cannot modify an archived form")
  }

  // 5. Ensure valid state
  if (form.versions.length === 0) {
    throw new ActionError("CONFLICT", "Form data is corrupted (no versions found)")
  }

  return { form, latestVersion: form.versions[0] }
}
