"use client";

import { useState } from "react";
import { CollaboratorAvatarStack } from "./CollaboratorAvatarStack";
import { CollaboratorManagementModal } from "./CollaboratorManagementModal";
import type { CollaborationSummaryDTO } from "../queries/getCollaborationSummary";

interface CollaborationHeaderControlsProps {
  formId: number;
  viewerRole: "OWNER" | "EDITOR" | "VIEWER";
  viewerUserId: number;
  collaboration: CollaborationSummaryDTO;
}

/**
 * Header entry point into the collaborator management modal (docs/refactor/
 * form-collaboration.md §6 item 4) — just the avatar stack now. There's no
 * separate role badge: each avatar in the stack (including the viewer's own)
 * carries its role as a colored ring + "{username} · {Role}" tooltip, so a
 * standalone badge would only duplicate what hovering your own avatar
 * already shows. The stack always has at least one avatar (the owner), so
 * it's a sufficient entry point on its own.
 */
export function CollaborationHeaderControls({
  formId,
  viewerRole,
  viewerUserId,
  collaboration,
}: CollaborationHeaderControlsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CollaboratorAvatarStack
        ownerId={collaboration.ownerId}
        ownerUsername={collaboration.ownerUsername}
        ownerAvatarEmail={collaboration.ownerAvatarEmail}
        collaborators={collaboration.collaborators}
        onClick={() => setIsModalOpen(true)}
      />
      <CollaboratorManagementModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formId={formId}
        viewerRole={viewerRole}
        viewerUserId={viewerUserId}
        ownerUsername={collaboration.ownerUsername}
        ownerAvatarEmail={collaboration.ownerAvatarEmail}
        initialCollaborators={collaboration.collaborators}
      />
    </>
  );
}
