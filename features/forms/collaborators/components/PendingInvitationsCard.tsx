"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { acceptCollaboratorInvite } from "../actions/acceptCollaboratorInvite";
import { declineCollaboratorInvite } from "../actions/declineCollaboratorInvite";
import type { PendingCollaboratorInviteDTO } from "../types";

interface PendingInvitationsCardProps {
  invites: PendingCollaboratorInviteDTO[];
}

const ROLE_LABEL: Record<"EDITOR" | "VIEWER", string> = { EDITOR: "an editor", VIEWER: "a viewer" };

/** Invites shown before the rest are tucked behind "Show all" — the query itself is unbounded. */
const COLLAPSED_INVITE_COUNT = 5;

/**
 * Dashboard card for pending collaborator invites (docs/refactor/
 * form-collaboration.md §6 item 2) — decided to be a card here rather than a
 * dedicated page, same reasoning as `DashboardNotificationsCard` sitting
 * next to it: too low-volume to need its own route.
 *
 * Renders the whole card (not just its body) so it can disappear entirely
 * when there's nothing pending — including right after the last invite is
 * accepted or declined here, which only this component's state knows about.
 */
export function PendingInvitationsCard({ invites: initialInvites }: PendingInvitationsCardProps) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [isPending, startTransition] = useTransition();
  const [showAll, setShowAll] = useState(false);

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

  if (invites.length === 0) return null;

  const visibleInvites = showAll ? invites : invites.slice(0, COLLAPSED_INVITE_COUNT);

  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-2xl font-bold">Pending Invitations</CardTitle>
        <div id="pending-invitations-list" className="divide-y divide-base-300">
          {visibleInvites.map((invite) => (
            <div key={invite.collaboratorId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg">
                  <span className="font-semibold text-primary">{invite.inviterUsername}</span> invited you to
                  collaborate on <span className="font-medium">&quot;{invite.formTitle}&quot;</span> as{" "}
                  {ROLE_LABEL[invite.role]}.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {/* Now that a pending invitee can open the form itself (view-only,
                    with its own accept/decline banner — docs/refactor/
                    form-collaboration.md §6 item 2 follow-up), this is a second,
                    lower-commitment entry point: look before deciding, rather
                    than accept/decline blind from just the invite text here. */}
                <Link href={`/collection/${invite.formId}`}>
                  <Button size="md" variant="ghost">
                    View
                  </Button>
                </Link>
                <Button size="md" variant="ghost" onClick={() => decline(invite.collaboratorId)} disabled={isPending}>
                  Decline
                </Button>
                <Button size="md" onClick={() => accept(invite.collaboratorId, invite.formId)} disabled={isPending}>
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
        {invites.length > COLLAPSED_INVITE_COUNT && (
          <div className="text-right mt-2">
            <Button
              variant="ghost"
              size="md"
              aria-expanded={showAll}
              aria-controls="pending-invitations-list"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show fewer" : `Show all (${invites.length})`}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
