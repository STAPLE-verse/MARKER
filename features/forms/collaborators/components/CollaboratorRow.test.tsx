import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollaboratorRow } from "./CollaboratorRow";
import type { CollaboratorDTO } from "../types";

const OWNER_ID = 1;
const SELF_ID = 2;
const OTHER_ID = 3;

function collaborator(overrides: Partial<CollaboratorDTO> = {}): CollaboratorDTO {
  return {
    collaboratorId: 100,
    userId: OTHER_ID,
    username: "jane_doe",
    name: "Jane Doe",
    avatarEmail: null,
    role: "EDITOR",
    isPending: false,
    invitedAt: new Date(),
    ...overrides,
  };
}

describe("CollaboratorRow", () => {
  it("owner sees an editable role select and a Remove button for an accepted row", () => {
    render(
      <CollaboratorRow
        collaborator={collaborator()}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("owner sees 'Invitation sent' and 'Cancel invite' for a pending row, not a role select", () => {
    render(
      <CollaboratorRow
        collaborator={collaborator({ isPending: true })}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText("Invitation sent")).toBeInTheDocument();
    expect(screen.getByText("Cancel invite")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("calls onRemove with the collaborator id when the owner clicks Remove", () => {
    const onRemove = vi.fn();
    render(
      <CollaboratorRow
        collaborator={collaborator({ collaboratorId: 42 })}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={onRemove}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText("Remove"));
    expect(onRemove).toHaveBeenCalledWith(42);
  });

  it("a non-owner viewing another collaborator's row sees a read-only role badge and no actions", () => {
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: OTHER_ID })}
        viewerRole="EDITOR"
        viewerUserId={SELF_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    expect(screen.queryByText("Leave")).not.toBeInTheDocument();
  });

  it("a non-owner viewing their own row gets a Leave button that calls onLeave, not onRemove", () => {
    const onRemove = vi.fn();
    const onLeave = vi.fn();
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: SELF_ID, collaboratorId: 7 })}
        viewerRole="EDITOR"
        viewerUserId={SELF_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={onRemove}
        onLeave={onLeave}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText("Leave"));
    expect(onLeave).toHaveBeenCalledWith(7);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("does not offer Leave on a still-pending row for its own invitee", () => {
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: SELF_ID, isPending: true })}
        viewerRole="VIEWER"
        viewerUserId={SELF_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={vi.fn()}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.queryByText("Leave")).not.toBeInTheDocument();
  });

  it("picking Owner in the role select asks for confirmation instead of calling onChangeRole", () => {
    const onChangeRole = vi.fn();
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: OTHER_ID, username: "jane_doe" })}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={onChangeRole}
        onTransferOwnership={vi.fn()}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "OWNER" } });

    expect(onChangeRole).not.toHaveBeenCalled();
    expect(screen.getByText(/the owner\?/)).toBeInTheDocument();
    expect(screen.getByText("Confirm transfer")).toBeInTheDocument();
    // The name and "the owner?" are separate JSX text nodes either side of a
    // <span> — assert on the rendered text as a whole, not the source, so a
    // future edit can't silently drop the space between them again.
    expect(screen.getByText(/the owner\?/).textContent).toBe("Make jane_doe the owner? You'll be demoted to Editor.");
  });

  it("confirming the Owner transfer calls onTransferOwnership with the collaborator's userId", () => {
    const onTransferOwnership = vi.fn();
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: OTHER_ID })}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={vi.fn()}
        onTransferOwnership={onTransferOwnership}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "OWNER" } });
    fireEvent.click(screen.getByText("Confirm transfer"));

    expect(onTransferOwnership).toHaveBeenCalledTimes(1);
    expect(onTransferOwnership.mock.calls[0][0]).toBe(OTHER_ID);
  });

  it("cancelling the Owner transfer confirmation reverts to the role select without calling anything", () => {
    const onChangeRole = vi.fn();
    const onTransferOwnership = vi.fn();
    render(
      <CollaboratorRow
        collaborator={collaborator({ userId: OTHER_ID })}
        viewerRole="OWNER"
        viewerUserId={OWNER_ID}
        onChangeRole={onChangeRole}
        onTransferOwnership={onTransferOwnership}
        onRemove={vi.fn()}
        onLeave={vi.fn()}
        isPending={false}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "OWNER" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(onChangeRole).not.toHaveBeenCalled();
    expect(onTransferOwnership).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirm transfer")).not.toBeInTheDocument();
  });
});
