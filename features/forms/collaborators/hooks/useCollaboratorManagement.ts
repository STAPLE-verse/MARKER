"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";
import { inviteCollaborator } from "../actions/inviteCollaborator";
import { updateCollaboratorRole } from "../actions/updateCollaboratorRole";
import { removeCollaborator } from "../actions/removeCollaborator";
import { transferOwnership } from "../actions/transferOwnership";
import type { CollaboratorDTO, CollaboratorRole, InvitableUserDTO } from "../types";

interface UseCollaboratorManagementOptions {
  formId: number;
  initialCollaborators: CollaboratorDTO[];
}

/**
 * Client-side state for the collaborator management modal (docs/refactor/
 * form-collaboration.md §6 item 1). Each mutation patches the local list
 * optimistically on success rather than re-fetching `getFormCollaborators`
 * — same pattern as `DashboardNotificationsCard`. Ownership-transfer actions
 * are the exception: they change the caller's own role or access entirely,
 * so they fall back to a full page refresh/redirect instead of a local patch.
 */
export function useCollaboratorManagement({ formId, initialCollaborators }: UseCollaboratorManagementOptions) {
  const router = useRouter();
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [isPending, startTransition] = useTransition();

  // `useState(initialCollaborators)` only seeds state on first mount — the
  // modal itself never unmounts (Modal.tsx toggles a native <dialog>'s
  // open/closed state, it doesn't conditionally render its children), so
  // without this, a fresh `initialCollaborators` from `router.refresh()`
  // (after invite/transfer/etc. from *another* tab, or the ownership
  // transfer below which changes who owns the form entirely) would never
  // reach this list: it'd keep showing whatever was last patched in locally,
  // silently drifting from the server truth every fresh prop delivers.
  useEffect(() => {
    setCollaborators(initialCollaborators);
  }, [initialCollaborators]);

  const invite = (invitee: InvitableUserDTO, role: CollaboratorRole, onDone?: () => void) => {
    startTransition(async () => {
      const res = await runAction(inviteCollaborator({ formId, inviteeUserId: invitee.userId, role }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCollaborators((prev) => [
        ...prev,
        {
          collaboratorId: res.data.collaboratorId,
          userId: invitee.userId,
          username: invitee.username,
          name: invitee.name,
          avatarEmail: invitee.avatarEmail,
          role,
          isPending: true,
          invitedAt: new Date(res.data.invitedAt),
        },
      ]);
      toast.success(`Invited ${invitee.username}`);
      onDone?.();
    });
  };

  const changeRole = (collaboratorId: number, role: CollaboratorRole) => {
    startTransition(async () => {
      const res = await runAction(updateCollaboratorRole({ formId, collaboratorId, role }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCollaborators((prev) => prev.map((c) => (c.collaboratorId === collaboratorId ? { ...c, role } : c)));
    });
  };

  const remove = (collaboratorId: number) => {
    startTransition(async () => {
      const res = await runAction(removeCollaborator({ formId, collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCollaborators((prev) => prev.filter((c) => c.collaboratorId !== collaboratorId));
    });
  };

  // Same underlying removal as `remove`, but for the viewer's *own* row: once
  // it succeeds they no longer have access to this form at all (they don't
  // match getFormById's owner-or-accepted-collaborator check anymore), so
  // patching the local list and staying put would just leave them on a page
  // that 404s the moment anything re-fetches it. Redirect instead, same as
  // the old combined transfer-and-leave action used to.
  const leave = (collaboratorId: number) => {
    startTransition(async () => {
      const res = await runAction(removeCollaborator({ formId, collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("You left this form");
      router.push("/collection");
    });
  };

  // Repoints MarkerForm.ownerId to someone else — the caller's own role
  // changes as a result, which nothing in local state can reflect, so a full
  // refresh (not a list patch) is what picks up the new role everywhere it's
  // read (header badge, action gating, this modal's own OWNER-only sections).
  const transfer = (newOwnerUserId: number, previousOwnerRole: CollaboratorRole, onDone: () => void) => {
    startTransition(async () => {
      const res = await runAction(transferOwnership({ formId, newOwnerUserId, previousOwnerRole }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Ownership transferred");
      onDone();
      router.refresh();
    });
  };

  return { collaborators, isPending, invite, changeRole, remove, leave, transfer };
}
