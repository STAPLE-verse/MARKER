import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const NEW_OWNER_ID = 2;
const NEW_OWNER_COLLABORATOR_ID = 20;

const findUniqueMarkerForm = vi.fn();
const findUniqueMarkerFormCollaborator = vi.fn();
const deleteMarkerFormCollaborator = vi.fn();
const createMarkerFormCollaborator = vi.fn();
const updateMarkerForm = vi.fn();
const findUniqueUser = vi.fn();
const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: {
      findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args),
      update: (...args: unknown[]) => updateMarkerForm(...args),
    },
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      delete: (...args: unknown[]) => deleteMarkerFormCollaborator(...args),
      create: (...args: unknown[]) => createMarkerFormCollaborator(...args),
    },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    notification: { create: (...args: unknown[]) => createNotificationRow(...args) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { transferOwnership } from "./transferOwnership";

describe("transferOwnership", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findUniqueMarkerFormCollaborator.mockReset();
    deleteMarkerFormCollaborator.mockReset();
    createMarkerFormCollaborator.mockReset();
    updateMarkerForm.mockReset();
    findUniqueUser.mockReset();
    createNotificationRow.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, status: "DRAFT", name: "Cognitive Assessment" }],
    });
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: NEW_OWNER_COLLABORATOR_ID,
      formId: FORM_ID,
      userId: NEW_OWNER_ID,
      acceptedAt: new Date(),
    });
    findUniqueUser.mockResolvedValue({ username: "jane_owner" });
  });

  it("deletes the new owner's collaborator row, creates one for the outgoing owner, and repoints ownerId", async () => {
    const result = await transferOwnership({
      formId: FORM_ID,
      newOwnerUserId: NEW_OWNER_ID,
      previousOwnerRole: "EDITOR",
    });

    expect(result.ok).toBe(true);
    expect(deleteMarkerFormCollaborator).toHaveBeenCalledWith({ where: { id: NEW_OWNER_COLLABORATOR_ID } });
    expect(createMarkerFormCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ formId: FORM_ID, userId: OWNER_ID, role: "EDITOR", invitedById: null }),
      })
    );
    expect(updateMarkerForm).toHaveBeenCalledWith({
      where: { id: FORM_ID },
      data: { ownerId: NEW_OWNER_ID },
    });
    expect(createNotificationRow).toHaveBeenCalledTimes(1);
    const data = createNotificationRow.mock.calls[0][0].data;
    expect(data.message).toBe('jane_owner made you the owner of "Cognitive Assessment".');
    expect(data.recipients).toEqual({ connect: [{ id: NEW_OWNER_ID }] });
  });

  it("rejects transferring to a user with no collaborator row at all", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue(null);

    const result = await transferOwnership({
      formId: FORM_ID,
      newOwnerUserId: NEW_OWNER_ID,
      previousOwnerRole: "EDITOR",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONFLICT");
    expect(updateMarkerForm).not.toHaveBeenCalled();
  });

  it("rejects transferring to a still-pending (unaccepted) collaborator", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: NEW_OWNER_COLLABORATOR_ID,
      formId: FORM_ID,
      userId: NEW_OWNER_ID,
      acceptedAt: null,
    });

    const result = await transferOwnership({
      formId: FORM_ID,
      newOwnerUserId: NEW_OWNER_ID,
      previousOwnerRole: "EDITOR",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONFLICT");
    expect(updateMarkerForm).not.toHaveBeenCalled();
  });

  it("rejects a non-owner caller", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: 999,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, status: "DRAFT" }],
    });

    const result = await transferOwnership({
      formId: FORM_ID,
      newOwnerUserId: NEW_OWNER_ID,
      previousOwnerRole: "EDITOR",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });
});
