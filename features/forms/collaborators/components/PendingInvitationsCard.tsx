"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import { acceptCollaboratorInvite } from "../actions/acceptCollaboratorInvite";
import { declineCollaboratorInvite } from "../actions/declineCollaboratorInvite";
import type { PendingCollaboratorInviteDTO } from "../types";

interface PendingInvitationsCardProps {
  invites: PendingCollaboratorInviteDTO[];
}

const ROLE_LABEL: Record<"EDITOR" | "VIEWER", string> = { EDITOR: "an editor", VIEWER: "a viewer" };

/**
 * Dashboard card for pending collaborator invites (docs/refactor/
 * form-collaboration.md §6 item 2) — decided to be a card here rather than a
 * dedicated page, same reasoning as `DashboardNotificationsCard` sitting
 * next to it: too low-volume to need its own route.
 */
export function PendingInvitationsCard({ invites: initialInvites }: PendingInvitationsCardProps) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [isPending, startTransition] = useTransition();

  const accept = (collaboratorId: number, formId: number) => {
    startTransition(async () => {
      const res = await runAction(acceptCollaboratorInvite({ collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setInvites((prev) => prev.filter((i) => i.collaboratorId !== collaboratorId));
      toast.success("Invitation accepted");
      router.push(`/collection/${formId}`);
    });
  };

  const decline = (collaboratorId: number) => {
    startTransition(async () => {
      const res = await runAction(declineCollaboratorInvite({ collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setInvites((prev) => prev.filter((i) => i.collaboratorId !== collaboratorId));
    });
  };

  if (invites.length === 0) {
    return <p className="py-8 text-center text-base-content/70">No pending invitations.</p>;
  }

  return (
    <div className="divide-y divide-base-300">
      {invites.map((invite) => (
        <div key={invite.collaboratorId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold text-primary">{invite.inviterUsername}</span> invited you to
              collaborate on <span className="font-medium">&quot;{invite.formTitle}&quot;</span> as{" "}
              {ROLE_LABEL[invite.role]}.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="xs" variant="ghost" onClick={() => decline(invite.collaboratorId)} disabled={isPending}>
              Decline
            </Button>
            <Button size="xs" onClick={() => accept(invite.collaboratorId, invite.formId)} disabled={isPending}>
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
