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

/**
 * A publish-time contributor suggestion (docs/refactor/form-collaboration.md
 * §4.7) — the owner plus every accepted collaborator (any role), shaped like
 * the existing owner/creator auto-seed (`createForm.ts` et al.) so the UI can
 * feed it straight into the same contributor-add flow. `name` is always
 * present and non-empty; a user with no first/last name on file is filtered
 * out server-side rather than suggested as a blank entry.
 */
export interface ContributorSuggestionDTO {
  userId: number
  name: string
  givenName?: string
  familyName?: string
  orcid?: string
  affiliations: { name: string }[]
}
