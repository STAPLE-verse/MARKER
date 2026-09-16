export type CollaboratorRole = "EDITOR" | "VIEWER"

export interface InvitableUserDTO {
  userId: number
  username: string
  name: string | null
  avatarEmail: string | null
}

/**
 * One row per `MarkerFormCollaborator`, pending or accepted alike — the UI
 * distinguishes by `isPending`, not by fetching two separate lists
 * (docs/refactor/form-collaboration.md §6 item 1).
 */
export interface CollaboratorDTO {
  collaboratorId: number
  userId: number
  username: string
  name: string | null
  avatarEmail: string | null
  role: CollaboratorRole
  isPending: boolean
  invitedAt: Date
}

export interface PendingCollaboratorInviteDTO {
  collaboratorId: number
  formId: number
  formTitle: string
  role: CollaboratorRole
  inviterUsername: string
  invitedAt: Date
}
