import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// This renders CollaboratorManagementModal (always mounted, just closed),
// which pulls in every collaborator server action transitively via
// useCollaboratorManagement — mock them so importing this test doesn't drag
// the real "use server" chain (and therefore next-auth) in at all, same
// issue as PublicationContributorsFields.test.tsx.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("../actions/inviteCollaborator", () => ({ inviteCollaborator: vi.fn() }));
vi.mock("../actions/updateCollaboratorRole", () => ({ updateCollaboratorRole: vi.fn() }));
vi.mock("../actions/removeCollaborator", () => ({ removeCollaborator: vi.fn() }));
vi.mock("../actions/transferOwnership", () => ({ transferOwnership: vi.fn() }));
vi.mock("../actions/searchInvitableUsers", () => ({ searchInvitableUsers: vi.fn() }));

import { CollaborationHeaderControls } from "./CollaborationHeaderControls";
import type { CollaborationSummaryDTO } from "../queries/getCollaborationSummary";

const OWNER_ID = 1;
const VIEWER_COLLABORATOR_ID = 2;

function collaboration(overrides: Partial<CollaborationSummaryDTO> = {}): CollaborationSummaryDTO {
  return {
    ownerId: OWNER_ID,
    ownerUsername: "jane_owner",
    ownerAvatarEmail: null,
    collaborators: [],
    ...overrides,
  };
}

describe("CollaborationHeaderControls", () => {
  it("gives the owner an avatar-stack entry point even with no collaborators at all", () => {
    render(
      <CollaborationHeaderControls
        formId={1}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        collaboration={collaboration()}
      />
    );

    // No separate role badge — the owner's role shows as a ring + tooltip on
    // their own avatar in the stack, which is always present.
    expect(screen.getByRole("button", { name: /jane_owner, Owner/ })).toBeInTheDocument();
  });

  it("still shows the stack (owner-only) when invites are pending but none are accepted yet", () => {
    render(
      <CollaborationHeaderControls
        formId={1}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        collaboration={collaboration({
          collaborators: [
            {
              collaboratorId: 1,
              userId: 99,
              username: "invitee",
              name: null,
              avatarEmail: null,
              role: "EDITOR",
              isPending: true,
              invitedAt: new Date(),
            },
          ],
        })}
      />
    );

    expect(screen.getByRole("button", { name: /jane_owner, Owner/ })).toBeInTheDocument();
  });

  it("shows the viewer's own role via their avatar's tooltip, alongside the owner's", () => {
    render(
      <CollaborationHeaderControls
        formId={1}
        viewerRole="EDITOR"
        viewerUserId={VIEWER_COLLABORATOR_ID}
        collaboration={collaboration({
          collaborators: [
            {
              collaboratorId: 1,
              userId: VIEWER_COLLABORATOR_ID,
              username: "me",
              name: null,
              avatarEmail: null,
              role: "EDITOR",
              isPending: false,
              invitedAt: new Date(),
            },
          ],
        })}
      />
    );

    expect(screen.getByRole("button", { name: /jane_owner, Owner/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /me, Editor/ })).toBeInTheDocument();
  });
});
