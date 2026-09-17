"use client";

import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CollaboratorRow } from "./CollaboratorRow";
import { InviteCollaboratorForm } from "./InviteCollaboratorForm";
import { useCollaboratorManagement } from "../hooks/useCollaboratorManagement";
import { ROLE_BADGE_VARIANT } from "../roleColors";
import type { CollaboratorDTO } from "../types";

interface CollaboratorManagementModalProps {
  open: boolean;
  onClose: () => void;
  formId: number;
  /** The person viewing the modal, not any particular row's subject. */
  viewerRole: "OWNER" | "EDITOR" | "VIEWER";
  viewerUserId: number;
  ownerUsername: string;
  ownerAvatarEmail: string | null;
  initialCollaborators: CollaboratorDTO[];
}

/**
 * The collaborator management surface (docs/refactor/form-collaboration.md
 * §6 item 1) — a modal, not a dedicated page (see the doc for why: mature
 * per-resource sharing UIs converge on one modal for everyone, content
 * varying by role, rather than a page that's substantial for OWNER and
 * nearly empty for EDITOR/VIEWER). OWNER gets the invite form and per-row
 * role dropdowns — "Owner" is one of the choices in that same dropdown
 * (CollaboratorRow), not a separate transfer control; EDITOR/VIEWER get the
 * same list read-only plus a "Leave" button on their own row.
 */
export function CollaboratorManagementModal({
  open,
  onClose,
  formId,
  viewerRole,
  viewerUserId,
  ownerUsername,
  ownerAvatarEmail,
  initialCollaborators,
}: CollaboratorManagementModalProps) {
  const { collaborators, isPending, invite, changeRole, remove, leave, transfer } = useCollaboratorManagement({
    formId,
    initialCollaborators,
  });

  const isOwnerViewer = viewerRole === "OWNER";
  const hasAcceptedCollaborator = collaborators.some((c) => !c.isPending);

  return (
    <Modal open={open} onClose={onClose} title="Collaborators" size="lg">
      <div className="space-y-6 mt-4">
        <ul className="list bg-base-100 rounded-box border border-base-300">
          <li className="list-row items-center gap-3 bg-base-200/50">
            <Avatar email={ownerAvatarEmail} fallback={ownerUsername[0]} size={36} />
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{ownerUsername}</div>
            </div>
            <Badge variant={ROLE_BADGE_VARIANT.OWNER} outline>
              Owner
            </Badge>
          </li>
          {collaborators.map((c) => (
            <CollaboratorRow
              key={c.collaboratorId}
              collaborator={c}
              viewerRole={viewerRole}
              viewerUserId={viewerUserId}
              onChangeRole={changeRole}
              onTransferOwnership={(newOwnerUserId, onDone) => transfer(newOwnerUserId, "EDITOR", onDone)}
              onRemove={remove}
              onLeave={leave}
              isPending={isPending}
            />
          ))}
          {collaborators.length === 0 && (
            <li className="p-4 text-sm text-base-content/60">No collaborators yet.</li>
          )}
        </ul>

        {isOwnerViewer && <InviteCollaboratorForm formId={formId} onInvite={invite} isPending={isPending} />}

        {/* An owner can only transfer ownership to an accepted collaborator
            (picked from that row's own role dropdown above) — with none yet,
            there's no row to pick from, so leaving isn't possible either. */}
        {isOwnerViewer && !hasAcceptedCollaborator && (
          <p className="text-sm text-base-content/60">
            Invite a collaborator and have them accept before you can transfer ownership or leave this form.
          </p>
        )}
      </div>
    </Modal>
  );
}
