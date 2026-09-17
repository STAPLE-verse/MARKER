import { Avatar } from "@/components/ui/Avatar";
import { ROLE_RING_COLOR } from "../roleColors";
import type { CollaboratorDTO, CollaboratorRole } from "../types";

type Role = "OWNER" | CollaboratorRole;

interface Person {
  key: string;
  username: string;
  avatarEmail: string | null;
  role: Role;
}

interface CollaboratorAvatarStackProps {
  ownerId: number;
  ownerUsername: string;
  ownerAvatarEmail: string | null;
  /** Full collaborator list (pending + accepted) — filtered to accepted rows here. */
  collaborators: CollaboratorDTO[];
  onClick: () => void;
  maxVisible?: number;
}

// Same colors as the role badges in CollaboratorManagementModal/
// CollaboratorRow (see roleColors.ts) — moved onto each avatar's border
// instead of a separate element, and extended to every person in the stack
// (not just the viewer's own role) since it can carry that for free.
//
// This is a `borderColor` *style*, not a `ring-*`/`border-*` class, and that
// matters: DaisyUI's `.avatar-group` sets `overflow: hidden` on itself and
// hard-codes `border: 4px solid var(--color-base-100)` on every `.avatar`
// inside it (the "cutout" look between overlapping avatars). A Tailwind
// `ring-*` utility is a box-shadow, which paints outside the avatar's own
// box — exactly what the group's overflow: hidden clips, which is why an
// earlier version of this rendered with the ring sliced off. Overriding via
// inline `style.borderColor` instead reuses DaisyUI's own already-unclipped
// border rather than fighting it with a second, incompatible mechanism, and
// an inline style also doesn't need to win a CSS layer-order contest against
// DaisyUI's own component-layer rule the way a `border-*` utility class
// would.
const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" };

/**
 * DaisyUI's avatar-group-with-counter pattern (docs/refactor/
 * form-collaboration.md §6 item 4) — everyone who currently has access to
 * this form, owner included regardless of who's viewing, each avatar ringed
 * in its role's color with a "{username} · {Role}" tooltip. Replaces a
 * separate role badge entirely: hovering your own avatar here shows your
 * role exactly as a standalone badge would have, but the same treatment
 * applies to everyone else's avatar too, for free. Always including the
 * owner means the stack is never empty — no separate fallback affordance
 * needed for a form nobody's been invited to yet. Pending invites are still
 * excluded — they don't have access yet, so there's no role to show.
 */
export function CollaboratorAvatarStack({
  ownerId,
  ownerUsername,
  ownerAvatarEmail,
  collaborators,
  onClick,
  maxVisible = 3,
}: CollaboratorAvatarStackProps) {
  const peopleWithAccess: Person[] = [
    { key: `owner-${ownerId}`, username: ownerUsername, avatarEmail: ownerAvatarEmail, role: "OWNER" },
    ...collaborators
      .filter((c) => !c.isPending)
      .map((c) => ({ key: `collab-${c.collaboratorId}`, username: c.username, avatarEmail: c.avatarEmail, role: c.role })),
  ];

  const visible = peopleWithAccess.slice(0, maxVisible);
  const overflowCount = peopleWithAccess.length - visible.length;

  return (
    // DaisyUI's `.avatar-group` also sets `overflow: hidden` on itself — the
    // same mechanism that clipped the role ring (see above) also clips the
    // tooltip popup entirely, since a `.tooltip[data-tip]:before` pseudo-
    // element is `position: absolute` and renders outside its trigger's own
    // box by design. Overridden via inline `style.overflow` for the same
    // reason the border-color override is inline: it wins regardless of
    // DaisyUI's own `@layer` order. Doesn't affect the overlapping "cutout"
    // look between avatars, which comes from each avatar's own opaque
    // border painting over the one behind it, not from clipping.
    <div className="avatar-group -space-x-3 shrink-0" style={{ overflow: "visible" }}>
      {visible.map((person) => (
        <button
          key={person.key}
          type="button"
          onClick={onClick}
          // Same hover-scale language components/ui/Button.tsx already uses
          // app-wide, so this reads as "clickable" consistently with
          // everything else — hover:z-10 so the scaled-up avatar pops above
          // its overlapping neighbors instead of paint order (DOM order)
          // leaving it partly behind whichever one comes after it.
          className="tooltip tooltip-bottom cursor-pointer transition-transform duration-200 hover:z-10 hover:scale-110"
          data-tip={`${person.username} · ${ROLE_LABEL[person.role]}`}
          aria-label={`${person.username}, ${ROLE_LABEL[person.role]} — manage collaborators`}
        >
          <Avatar
            email={person.avatarEmail}
            fallback={person.username[0]}
            size={28}
            // The border sits on this div with no padding of its own, so
            // without this it hugs the inner circle directly instead of
            // reading as a ring around it. The gap is deliberately
            // transparent, not a hardcoded background color, so it shows
            // whatever's actually behind the avatar in either theme.
            className="p-0.5"
            style={{ borderColor: ROLE_RING_COLOR[person.role] }}
          />
        </button>
      ))}
      {overflowCount > 0 && (
        <button
          type="button"
          onClick={onClick}
          className="tooltip tooltip-bottom cursor-pointer transition-transform duration-200 hover:z-10 hover:scale-110"
          data-tip={`${overflowCount} more`}
          aria-label={`${overflowCount} more collaborators — manage collaborators`}
        >
          <Avatar
            fallback={`+${overflowCount}`}
            size={28}
            className="p-0.5"
            style={{ borderColor: "var(--color-base-200)" }}
          />
        </button>
      )}
    </div>
  );
}
