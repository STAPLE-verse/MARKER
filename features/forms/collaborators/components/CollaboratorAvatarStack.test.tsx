import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollaboratorAvatarStack } from "./CollaboratorAvatarStack";
import type { CollaboratorDTO } from "../types";

const OWNER_ID = 1;

function collaborator(overrides: Partial<CollaboratorDTO> = {}): CollaboratorDTO {
  return {
    collaboratorId: 1,
    userId: 10,
    username: "jane_doe",
    name: null,
    avatarEmail: null,
    role: "EDITOR",
    isPending: false,
    invitedAt: new Date(),
    ...overrides,
  };
}

describe("CollaboratorAvatarStack", () => {
  it("always shows at least the owner, even with no collaborators — never an empty entry point", () => {
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[]}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /jane_owner, Owner/ })).toBeInTheDocument();
  });

  it("rings the owner's avatar distinctly from a collaborator's, with a role tooltip on each", () => {
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[collaborator({ userId: 20, username: "other", role: "VIEWER" })]}
        onClick={vi.fn()}
      />
    );

    const ownerButton = screen.getByRole("button", { name: /jane_owner, Owner/ });
    const otherButton = screen.getByRole("button", { name: /other, Viewer/ });
    expect(ownerButton.getAttribute("data-tip")).toBe("jane_owner · Owner");
    expect(otherButton.getAttribute("data-tip")).toBe("other · Viewer");
    // A `borderColor` style, not a ring-*/border-* class — see the component's
    // comment: DaisyUI's `.avatar-group` clips box-shadow-based rings via its
    // own `overflow: hidden`, so the role color has to override DaisyUI's own
    // avatar-group border instead of adding a competing ring on top of it.
    const ownerAvatar = ownerButton.querySelector(".avatar") as HTMLElement;
    const otherAvatar = otherButton.querySelector(".avatar") as HTMLElement;
    expect(ownerAvatar.style.borderColor).toBe("var(--color-primary)");
    expect(otherAvatar.style.borderColor).toBe("var(--color-accent)");
  });

  it("does not exclude the viewer's own entry — the stack shows everyone with access, not just 'everyone else'", () => {
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[collaborator({ userId: 20, username: "other" })]}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("j")).toBeInTheDocument(); // owner fallback initial
    expect(screen.getByText("o")).toBeInTheDocument(); // "other" fallback initial
  });

  it("excludes pending invites from the avatar stack", () => {
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[collaborator({ userId: 20, username: "pending_user", isPending: true })]}
        onClick={vi.fn()}
      />
    );

    expect(screen.queryByText("p")).not.toBeInTheDocument();
  });

  it("shows a +N overflow avatar beyond maxVisible", () => {
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[
          collaborator({ collaboratorId: 1, userId: 20, username: "a" }),
          collaborator({ collaboratorId: 2, userId: 21, username: "b" }),
          collaborator({ collaboratorId: 3, userId: 22, username: "c" }),
        ]}
        onClick={vi.fn()}
        maxVisible={2}
      />
    );

    // owner + a + b + c = 4 people with access; maxVisible 2 -> 2 shown + "+2" overflow.
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("calls onClick when an avatar is clicked", () => {
    const onClick = vi.fn();
    render(
      <CollaboratorAvatarStack
        ownerId={OWNER_ID}
        ownerUsername="jane_owner"
        ownerAvatarEmail={null}
        collaborators={[]}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /jane_owner, Owner/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
