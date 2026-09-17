import type { BadgeProps } from "@/components/ui/Badge";

export type CollaborationRole = "OWNER" | "EDITOR" | "VIEWER";

/**
 * Single source of truth for "what color is this role," shared by every
 * place a role shows up: the avatar stack's ring (CollaboratorAvatarStack),
 * the owner's badge and each row's role badge (CollaboratorManagementModal /
 * CollaboratorRow). All three semantic daisyUI colors, deliberately not
 * `neutral`/`base-*` — those resolve to a near-black fill in the dark theme
 * (and several of the other selectable themes), which made the Viewer ring
 * and an earlier version of the role badge effectively invisible.
 */
export const ROLE_BADGE_VARIANT: Record<CollaborationRole, BadgeProps["variant"]> = {
  OWNER: "primary",
  EDITOR: "info",
  VIEWER: "accent",
};

/** Same colors as `ROLE_BADGE_VARIANT`, as CSS var references for inline `style.borderColor` use. */
export const ROLE_RING_COLOR: Record<CollaborationRole, string> = {
  OWNER: "var(--color-primary)",
  EDITOR: "var(--color-info)",
  VIEWER: "var(--color-accent)",
};
