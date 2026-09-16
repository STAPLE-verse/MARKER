import { MarkerFormCollaboratorRole } from "@prisma/client"
import { ActionError } from "@/utils/action-result"

const ROLE_RANK: Record<MarkerFormCollaboratorRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
}

export interface FormRoleContext {
  ownerId: number
  collaborators: { role: MarkerFormCollaboratorRole }[]
}

/**
 * `MarkerFormCollaborator.role` never persists `OWNER` as a value (docs/refactor/
 * form-collaboration.md §5) — the owner is always `MarkerForm.ownerId` alone.
 * `collaborators` is expected to already be scoped to this one user's accepted
 * row (at most one, per `@@unique([formId, userId])`).
 */
export function resolveFormRole(
  form: FormRoleContext,
  userId: number
): MarkerFormCollaboratorRole | null {
  if (form.ownerId === userId) return "OWNER"
  return form.collaborators?.[0]?.role ?? null
}

export function roleSatisfies(
  role: MarkerFormCollaboratorRole,
  minimumRole: MarkerFormCollaboratorRole
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimumRole]
}

/**
 * Shared write-side role guard (docs/refactor/form-collaboration.md §4.1-§4.2)
 * — the one place `(form, userId) -> allowed?` is decided, used by
 * `getAuthorizedLatestVersion`, `getAuthorizedArchivedForm`, and
 * `cloneFormVersion` alike so none of them re-derive ownership inline.
 */
export function assertFormRole(
  form: FormRoleContext,
  userId: number,
  minimumRole: MarkerFormCollaboratorRole,
  message = "You do not have permission to modify this form"
): void {
  const role = resolveFormRole(form, userId)
  if (!role || !roleSatisfies(role, minimumRole)) {
    throw new ActionError("FORBIDDEN", message)
  }
}
