import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PendingInviteBanner } from "./PendingInviteBanner";

const push = vi.fn();
const refresh = vi.fn();
const acceptCollaboratorInvite = vi.fn();
const declineCollaboratorInvite = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("../actions/acceptCollaboratorInvite", () => ({
  acceptCollaboratorInvite: (...args: unknown[]) => acceptCollaboratorInvite(...args),
}));
vi.mock("../actions/declineCollaboratorInvite", () => ({
  declineCollaboratorInvite: (...args: unknown[]) => declineCollaboratorInvite(...args),
}));

describe("PendingInviteBanner", () => {
  it("names the invited role in its message", () => {
    render(<PendingInviteBanner collaboratorId={5} role="EDITOR" />);
    expect(screen.getByText(/as an editor/)).toBeInTheDocument();
  });

  it("refreshes in place (not a redirect) on a successful accept", async () => {
    acceptCollaboratorInvite.mockResolvedValue({ ok: true, data: { success: true, formId: 42 } });
    render(<PendingInviteBanner collaboratorId={5} role="EDITOR" />);

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => expect(acceptCollaboratorInvite).toHaveBeenCalledWith({ collaboratorId: 5 }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard on a successful decline", async () => {
    declineCollaboratorInvite.mockResolvedValue({ ok: true, data: { success: true } });
    render(<PendingInviteBanner collaboratorId={5} role="VIEWER" />);

    fireEvent.click(screen.getByText("Decline"));

    await waitFor(() => expect(declineCollaboratorInvite).toHaveBeenCalledWith({ collaboratorId: 5 }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("does not navigate when accept fails", async () => {
    acceptCollaboratorInvite.mockResolvedValue({ ok: false, code: "CONFLICT", error: "already accepted" });
    render(<PendingInviteBanner collaboratorId={5} role="EDITOR" />);

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => expect(acceptCollaboratorInvite).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
