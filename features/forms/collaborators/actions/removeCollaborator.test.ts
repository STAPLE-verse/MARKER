import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const CALLER_ID = 1;
const OTHER_COLLABORATOR_ID = 2;
const OTHER_OWNER_ID = 99;
const COLLABORATOR_ID = 50;

const findUniqueMarkerFormCollaborator = vi.fn();
const deleteMarkerFormCollaborator = vi.fn();
const findUniqueUser = vi.fn();
const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      delete: (...args: unknown[]) => deleteMarkerFormCollaborator(...args),
    },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    notification: { create: (...args: unknown[]) => createNotificationRow(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: CALLER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { removeCollaborator } from "./removeCollaborator";

function mockRow(overrides: Record<string, unknown> = {}) {
  findUniqueMarkerFormCollaborator.mockResolvedValue({
    id: COLLABORATOR_ID,
    formId: FORM_ID,
    userId: OTHER_COLLABORATOR_ID,
    acceptedAt: new Date("2026-09-01T00:00:00.000Z"),
    form: {
      ownerId: CALLER_ID,
      collaborators: [],
      versions: [{ name: "Cognitive Assessment" }],
    },
    ...overrides,
  });
}

describe("removeCollaborator", () => {
  beforeEach(() => {
    findUniqueMarkerFormCollaborator.mockReset();
    deleteMarkerFormCollaborator.mockReset();
    findUniqueUser.mockReset();
    createNotificationRow.mockReset();
    findUniqueUser.mockResolvedValue({ username: "jane_owner" });
  });

  it("lets the owner remove another collaborator and notifies them", async () => {
    mockRow();

    const result = await removeCollaborator({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(true);
    expect(deleteMarkerFormCollaborator).toHaveBeenCalledWith({ where: { id: COLLABORATOR_ID } });
    expect(createNotificationRow).toHaveBeenCalledTimes(1);
    const data = createNotificationRow.mock.calls[0][0].data;
    expect(data.message).toBe('jane_owner removed you from "Cognitive Assessment".');
  });

  it("skips notifying when the owner cancels a still-pending invite", async () => {
    mockRow({ acceptedAt: null });

    const result = await removeCollaborator({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(true);
    expect(deleteMarkerFormCollaborator).toHaveBeenCalled();
    expect(createNotificationRow).not.toHaveBeenCalled();
  });

  it("lets a collaborator remove themselves without an OWNER role check", async () => {
    // The caller IS the collaborator being removed, and does NOT own the form —
    // self-removal must not require the OWNER role.
    mockRow({ userId: CALLER_ID, form: { ownerId: OTHER_OWNER_ID, collaborators: [], versions: [{ name: "Schema" }] } });

    const result = await removeCollaborator({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(true);
    expect(deleteMarkerFormCollaborator).toHaveBeenCalled();
    expect(createNotificationRow.mock.calls[0][0].data.message).toBe('You left "Schema".');
  });

  it("rejects a non-owner, non-self caller trying to remove someone else", async () => {
    mockRow({ form: { ownerId: OTHER_OWNER_ID, collaborators: [], versions: [{ name: "Schema" }] } });

    const result = await removeCollaborator({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
    expect(deleteMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a collaborator id that doesn't belong to this form", async () => {
    mockRow({ formId: 999 });

    const result = await removeCollaborator({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});
