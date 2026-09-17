"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";
import { acceptCollaboratorInvite } from "../actions/acceptCollaboratorInvite";
import { declineCollaboratorInvite } from "../actions/declineCollaboratorInvite";

interface PendingInviteBannerProps {
  /** Only used for the copy below ("as an editor" / "as a viewer") — accept/decline are authorized by invite identity, not this. */
  role: "OWNER" | "EDITOR" | "VIEWER";
  collaboratorId: number;
  className?: string;
}

/**
 * The accept/decline entry point on the form detail page itself
 * (docs/refactor/form-collaboration.md §6 item 2 follow-up) — a second path
 * to the same two actions `PendingInvitationsCard` already exposes on the
 * dashboard, not a replacement for it. Both call the same
 * accept/declineCollaboratorInvite actions, which authorize purely by
 * `invite.userId === userId`, independent of the viewer's role on this form
 * — see those actions' own comments.
 */
export function PendingInviteBanner({ role, collaboratorId, className }: PendingInviteBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const roleLabel = role === "EDITOR" ? "an editor" : role === "VIEWER" ? "a viewer" : "a collaborator";

  const accept = () => {
    startTransition(async () => {
      const res = await runAction(acceptCollaboratorInvite({ collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation accepted");
      // Stay on this page — router.refresh() re-fetches getFormById, which
      // now sees the accepted row and unlocks the real role's actions.
      router.refresh();
    });
  };

  const decline = () => {
    startTransition(async () => {
      const res = await runAction(declineCollaboratorInvite({ collaboratorId }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation declined");
      router.push("/dashboard");
    });
  };

  return (
    <Alert variant="info" title="You've been invited to collaborate" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          You&apos;ve been invited to collaborate on this form as {roleLabel}. You can look around, but nothing is
          editable until you accept.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={decline} disabled={isPending}>
            Decline
          </Button>
          <Button size="sm" onClick={accept} disabled={isPending}>
            Accept
          </Button>
        </div>
      </div>
    </Alert>
  );
}
