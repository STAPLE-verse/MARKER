import { z } from "zod"

// MarkerFormCollaborator.role never persists OWNER as a value (docs/refactor/
// form-collaboration.md §5) — ownership only ever moves via transferOwnership,
// never as a plain role edit, so every schema that accepts a role to assign
// restricts it to these two structurally.
const collaboratorRoleSchema = z.enum(["EDITOR", "VIEWER"])

export const searchInvitableUsersSchema = z.object({
  formId: z.number(),
  query: z.string().min(1),
})
export type SearchInvitableUsersInput = z.infer<typeof searchInvitableUsersSchema>

export const inviteCollaboratorSchema = z.object({
  formId: z.number(),
  inviteeUserId: z.number(),
  role: collaboratorRoleSchema,
})
export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>

export const collaboratorIdActionSchema = z.object({
  formId: z.number(),
  collaboratorId: z.number(),
})
export type CollaboratorIdActionInput = z.infer<typeof collaboratorIdActionSchema>

export const acceptOrDeclineInviteSchema = z.object({
  collaboratorId: z.number(),
})
export type AcceptOrDeclineInviteInput = z.infer<typeof acceptOrDeclineInviteSchema>

export const updateCollaboratorRoleSchema = collaboratorIdActionSchema.extend({
  role: collaboratorRoleSchema,
})
export type UpdateCollaboratorRoleInput = z.infer<typeof updateCollaboratorRoleSchema>

export const transferOwnershipSchema = z.object({
  formId: z.number(),
  newOwnerUserId: z.number(),
  previousOwnerRole: collaboratorRoleSchema,
})
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>

export const transferOwnershipAndLeaveSchema = z.object({
  formId: z.number(),
  newOwnerUserId: z.number(),
})
export type TransferOwnershipAndLeaveInput = z.infer<typeof transferOwnershipAndLeaveSchema>
