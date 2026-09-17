import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PendingInvitationsCard } from "./PendingInvitationsCard";

const push = vi.fn();
const acceptCollaboratorInvite = vi.fn();
const declineCollaboratorInvite = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../actions/acceptCollaboratorInvite", () => ({
  acceptCollaboratorInvite: (...args: unknown[]) => acceptCollaboratorInvite(...args),
}));
vi.mock("../actions/declineCollaboratorInvite", () => ({
  declineCollaboratorInvite: (...args: unknown[]) => declineCollaboratorInvite(...args),
}));

function invite(overrides: Record<string, unknown> = {}) {
  return {
    collaboratorId: 1,
    formId: 42,
    formTitle: "Cognitive Assessment",
    role: "EDITOR" as const,
    inviterUsername: "jane_doe",
    invitedAt: new Date(),
    ...overrides,
  };
}

describe("PendingInvitationsCard", () => {
  beforeEach(() => {
    push.mockReset();
    acceptCollaboratorInvite.mockReset();
    declineCollaboratorInvite.mockReset();
  });

  it("shows an empty state when there are no pending invites", () => {
    render(<PendingInvitationsCard invites={[]} />);

    expect(screen.getByText("No pending invitations.")).toBeInTheDocument();
  });

  it("renders the inviter, form title, and role", () => {
    render(<PendingInvitationsCard invites={[invite()]} />);

    expect(screen.getByText("jane_doe")).toBeInTheDocument();
    expect(screen.getByText(/Cognitive Assessment/)).toBeInTheDocument();
    expect(screen.getByText(/an editor/)).toBeInTheDocument();
  });

  it("accepting removes the row and navigates to the form", async () => {
    acceptCollaboratorInvite.mockResolvedValue({ ok: true, data: { success: true, formId: 42 } });
    render(<PendingInvitationsCard invites={[invite()]} />);

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => {
      expect(acceptCollaboratorInvite).toHaveBeenCalledWith({ collaboratorId: 1 });
      expect(push).toHaveBeenCalledWith("/collection/42");
      expect(screen.getByText("No pending invitations.")).toBeInTheDocument();
    });
  });

  it("declining removes the row without navigating", async () => {
    declineCollaboratorInvite.mockResolvedValue({ ok: true, data: { success: true } });
    render(<PendingInvitationsCard invites={[invite()]} />);

    fireEvent.click(screen.getByText("Decline"));

    await waitFor(() => {
      expect(declineCollaboratorInvite).toHaveBeenCalledWith({ collaboratorId: 1 });
      expect(screen.getByText("No pending invitations.")).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("leaves the row in place when accepting fails", async () => {
    acceptCollaboratorInvite.mockResolvedValue({ ok: false, code: "CONFLICT", error: "Already accepted" });
    render(<PendingInvitationsCard invites={[invite()]} />);

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => expect(acceptCollaboratorInvite).toHaveBeenCalled());
    expect(screen.getByText("jane_doe")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
