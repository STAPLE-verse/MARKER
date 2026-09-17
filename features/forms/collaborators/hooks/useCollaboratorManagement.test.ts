import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { CollaboratorDTO } from "../types";

const FORM_ID = 1;
const refresh = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const inviteCollaborator = vi.fn();
const updateCollaboratorRole = vi.fn();
const removeCollaborator = vi.fn();
const transferOwnership = vi.fn();

vi.mock("../actions/inviteCollaborator", () => ({ inviteCollaborator: (...args: unknown[]) => inviteCollaborator(...args) }));
vi.mock("../actions/updateCollaboratorRole", () => ({
  updateCollaboratorRole: (...args: unknown[]) => updateCollaboratorRole(...args),
}));
vi.mock("../actions/removeCollaborator", () => ({ removeCollaborator: (...args: unknown[]) => removeCollaborator(...args) }));
vi.mock("../actions/transferOwnership", () => ({ transferOwnership: (...args: unknown[]) => transferOwnership(...args) }));

import { useCollaboratorManagement } from "./useCollaboratorManagement";

function baseCollaborator(overrides: Record<string, unknown> = {}) {
  return {
    collaboratorId: 1,
    userId: 10,
    username: "jane_doe",
    name: null,
    avatarEmail: null,
    role: "EDITOR" as const,
    isPending: false,
    invitedAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

// Hoisted, not inlined at each call site: `initialCollaborators` now syncs
// via a `useEffect([initialCollaborators])` (see the hook), so a fresh array
// *literal* re-created on every render of renderHook's wrapper component
// would never be reference-equal to itself and would loop forever. Real
// callers (CollaboratorManagementModal) always pass a stable prop reference,
// so these constants are what actually models that, not a workaround.
const EMPTY: CollaboratorDTO[] = [];
const ONE_COLLABORATOR: CollaboratorDTO[] = [baseCollaborator()];

describe("useCollaboratorManagement", () => {
  beforeEach(() => {
    refresh.mockReset();
    push.mockReset();
    inviteCollaborator.mockReset();
    updateCollaboratorRole.mockReset();
    removeCollaborator.mockReset();
    transferOwnership.mockReset();
  });

  it("appends a new pending row on a successful invite, without a round trip through getFormCollaborators", async () => {
    inviteCollaborator.mockResolvedValue({
      ok: true,
      data: { success: true, collaboratorId: 99, invitedAt: "2026-09-02T00:00:00.000Z" },
    });
    const { result } = renderHook(() => useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: EMPTY }));

    act(() => {
      result.current.invite({ userId: 55, username: "new_person", name: null, avatarEmail: null }, "VIEWER");
    });

    await waitFor(() => expect(result.current.collaborators).toHaveLength(1));
    expect(result.current.collaborators[0]).toMatchObject({
      collaboratorId: 99,
      userId: 55,
      username: "new_person",
      role: "VIEWER",
      isPending: true,
    });
  });

  it("leaves the list untouched when an invite fails", async () => {
    inviteCollaborator.mockResolvedValue({ ok: false, code: "CONFLICT", error: "Already invited" });
    const { result } = renderHook(() => useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: EMPTY }));

    act(() => {
      result.current.invite({ userId: 55, username: "new_person", name: null, avatarEmail: null }, "VIEWER");
    });

    await waitFor(() => expect(inviteCollaborator).toHaveBeenCalled());
    expect(result.current.collaborators).toHaveLength(0);
  });

  it("patches a role change locally on success", async () => {
    updateCollaboratorRole.mockResolvedValue({ ok: true, data: { success: true } });
    const { result } = renderHook(() =>
      useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: ONE_COLLABORATOR })
    );

    act(() => {
      result.current.changeRole(1, "VIEWER");
    });

    await waitFor(() => expect(result.current.collaborators[0].role).toBe("VIEWER"));
  });

  it("removes a row locally on successful removal", async () => {
    removeCollaborator.mockResolvedValue({ ok: true, data: { success: true } });
    const { result } = renderHook(() =>
      useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: ONE_COLLABORATOR })
    );

    act(() => {
      result.current.remove(1);
    });

    await waitFor(() => expect(result.current.collaborators).toHaveLength(0));
  });

  it("redirects to /collection after successfully leaving, instead of patching the list and staying on a form the viewer no longer has access to", async () => {
    removeCollaborator.mockResolvedValue({ ok: true, data: { success: true } });
    const { result } = renderHook(() =>
      useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: ONE_COLLABORATOR })
    );

    act(() => {
      result.current.leave(1);
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/collection"));
  });

  it("does not redirect when leave fails", async () => {
    removeCollaborator.mockResolvedValue({ ok: false, code: "FORBIDDEN", error: "nope" });
    const { result } = renderHook(() =>
      useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: ONE_COLLABORATOR })
    );

    act(() => {
      result.current.leave(1);
    });

    await waitFor(() => expect(removeCollaborator).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("refreshes the page (not a local patch) after a successful ownership transfer, since the caller's own role changed", async () => {
    transferOwnership.mockResolvedValue({ ok: true, data: { success: true } });
    const onDone = vi.fn();
    const { result } = renderHook(() => useCollaboratorManagement({ formId: FORM_ID, initialCollaborators: EMPTY }));

    act(() => {
      result.current.transfer(55, "EDITOR", onDone);
    });

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("resyncs to a fresh initialCollaborators list when the parent re-renders with new data (e.g. after router.refresh())", () => {
    const staleRow = baseCollaborator({ collaboratorId: 1, username: "haha", role: "EDITOR" });
    const freshRow = baseCollaborator({ collaboratorId: 2, userId: 15, username: "marci", role: "EDITOR" });
    const { result, rerender } = renderHook(
      ({ initialCollaborators }) => useCollaboratorManagement({ formId: FORM_ID, initialCollaborators }),
      { initialProps: { initialCollaborators: [staleRow] } }
    );

    expect(result.current.collaborators).toEqual([staleRow]);

    // Same component instance, new props — exactly what a `router.refresh()`
    // after a successful ownership transfer looks like: the modal never
    // unmounts, it just receives a new `initialCollaborators` array.
    rerender({ initialCollaborators: [freshRow] });

    expect(result.current.collaborators).toEqual([freshRow]);
  });
});
