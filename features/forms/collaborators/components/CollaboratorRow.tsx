import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ROLE_BADGE_VARIANT } from "../roleColors";
import type { CollaboratorDTO, CollaboratorRole } from "../types";

interface CollaboratorRowProps {
  collaborator: CollaboratorDTO;
  /** The person viewing the modal, not the row's own subject. */
  viewerRole: "OWNER" | "EDITOR" | "VIEWER";
  viewerUserId: number;
  onChangeRole: (collaboratorId: number, role: CollaboratorRole) => void;
  onTransferOwnership: (newOwnerUserId: number, onDone: () => void) => void;
  onRemove: (collaboratorId: number) => void;
  /** Removing your own (accepted) row — distinct from `onRemove` because it redirects, not just patches the list. */
  onLeave: (collaboratorId: number) => void;
  isPending: boolean;
}

const ROLE_LABEL: Record<CollaboratorRole, string> = { EDITOR: "Editor", VIEWER: "Viewer" };

/**
 * One row in the unified collaborator list (docs/refactor/
 * form-collaboration.md §6 item 1) — a pending invite and an accepted
 * collaborator are the same underlying row, differing only in `isPending`:
 * a pending row shows an "Invitation sent" badge in place of the role and
 * "Cancel invite" instead of "Remove," same `onRemove` call either way.
 *
 * "Owner" lives as a third option in this same role `<select>` rather than a
 * separate transfer-ownership control — picking it always demotes the
 * current owner to Editor (no role choice to make, unlike an ordinary role
 * change), so it needs its own confirmation step before committing. Leaving
 * the form afterward is a deliberate, separate action: once the transfer
 * lands, the ex-owner is just another collaborator viewing their own row,
 * where the existing self-row "Leave" button already applies.
 */
export function CollaboratorRow({
  collaborator,
  viewerRole,
  viewerUserId,
  onChangeRole,
  onTransferOwnership,
  onRemove,
  onLeave,
  isPending,
}: CollaboratorRowProps) {
  const isOwnerViewer = viewerRole === "OWNER";
  const isSelf = collaborator.userId === viewerUserId;
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);

  const handleRoleSelect = (value: string) => {
    if (value === "OWNER") {
      setConfirmingTransfer(true);
      return;
    }
    onChangeRole(collaborator.collaboratorId, value as CollaboratorRole);
  };

  return (
    <>
      <li className="list-row items-center gap-3">
        <Avatar email={collaborator.avatarEmail} fallback={collaborator.username[0]} size={36} />
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{collaborator.username}</div>
          {collaborator.name && <div className="text-xs text-base-content/60 truncate">{collaborator.name}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Action button first, badge/select last — keeps the badge flush
              against the row's right edge whether or not a row has a button. */}
          {isOwnerViewer && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onRemove(collaborator.collaboratorId)}
              disabled={isPending}
            >
              {collaborator.isPending ? "Cancel invite" : "Remove"}
            </Button>
          )}
          {!isOwnerViewer && isSelf && !collaborator.isPending && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onLeave(collaborator.collaboratorId)}
              disabled={isPending}
            >
              Leave
            </Button>
          )}

          {collaborator.isPending ? (
            <Badge variant="ghost" outline>
              Invitation sent
            </Badge>
          ) : isOwnerViewer ? (
            <select
              className="select select-bordered select-sm"
              value={confirmingTransfer ? "OWNER" : collaborator.role}
              onChange={(e) => handleRoleSelect(e.target.value)}
              disabled={isPending || confirmingTransfer}
              aria-label={`Role for ${collaborator.username}`}
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
              <option value="OWNER">Owner</option>
            </select>
          ) : (
            <Badge variant={ROLE_BADGE_VARIANT[collaborator.role]} outline>
              {ROLE_LABEL[collaborator.role]}
            </Badge>
          )}
        </div>
      </li>
      {confirmingTransfer && (
        <li className="list-row items-center gap-3 bg-base-200/50">
          <p className="text-sm flex-1 min-w-0">
            Make <span className="font-medium">{collaborator.username}</span>{" "}
            the owner? You&apos;ll be demoted to Editor.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="xs" variant="ghost" onClick={() => setConfirmingTransfer(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="primary"
              onClick={() => onTransferOwnership(collaborator.userId, () => setConfirmingTransfer(false))}
              disabled={isPending}
            >
              Confirm transfer
            </Button>
          </div>
        </li>
      )}
    </>
  );
}
