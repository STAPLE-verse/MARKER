import type { FormDetailDTO } from "../types"

/**
 * Whether this viewer can make content edits to the form — the one shared
 * definition every UI surface checks (the detail page's cards, the header's
 * action buttons, the `/edit` direct-URL guard), mirroring `formRole.ts`'s
 * `resolveFormRole`/`assertFormRole` as the single write-side primitive.
 *
 * `role` alone is never enough: a still-pending invitee's `role` is their
 * *invited* role, not a granted one (see `FormDetailDTO.role`) — this exists
 * so nothing has to re-derive that combination inline. Write actions
 * independently re-check permission server-side regardless of what this
 * returns, so this is a display/UI decision only, never a security boundary
 * on its own.
 */
export function canEditForm(form: Pick<FormDetailDTO, "role" | "isPendingInvite">): boolean {
  return (form.role === "OWNER" || form.role === "EDITOR") && !form.isPendingInvite
}
