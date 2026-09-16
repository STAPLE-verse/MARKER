import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const OTHER_USER_ID = 2;
const COLLABORATOR_A_ID = 10;
const COLLABORATOR_B_ID = 11;

const findUniqueMarkerForm = vi.fn();
const updateMarkerForm = vi.fn();
const updateManyMarkerFormVersion = vi.fn();
const findManyMarkerFormCollaborator = vi.fn();
const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: {
      findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args),
      update: (...args: unknown[]) => updateMarkerForm(...args),
    },
    markerFormVersion: { updateMany: (...args: unknown[]) => updateManyMarkerFormVersion(...args) },
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
    notification: { create: (...args: unknown[]) => createNotificationRow(...args) },
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { archiveForm } from "./archiveForm";

describe("archiveForm", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    updateMarkerForm.mockReset();
    updateManyMarkerFormVersion.mockReset();
    findManyMarkerFormCollaborator.mockReset();
    createNotificationRow.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, name: "Cognitive Assessment", status: "DRAFT" }],
    });
    updateMarkerForm.mockResolvedValue({ id: FORM_ID, archived: true });
    updateManyMarkerFormVersion.mockResolvedValue({ count: 1 });
  });

  it("notifies every accepted collaborator when the form is archived", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([{ userId: COLLABORATOR_A_ID }, { userId: COLLABORATOR_B_ID }]);

    const result = await archiveForm({ formId: FORM_ID });

    expect(result.ok).toBe(true);
    expect(createNotificationRow).toHaveBeenCalledTimes(1);
    const data = createNotificationRow.mock.calls[0][0].data;
    expect(data.recipients).toEqual({ connect: [{ id: COLLABORATOR_A_ID }, { id: COLLABORATOR_B_ID }] });
    expect(data.message).toContain("Cognitive Assessment");
  });

  it("skips the notification entirely when there are no collaborators", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([]);

    const result = await archiveForm({ formId: FORM_ID });

    expect(result.ok).toBe(true);
    expect(createNotificationRow).not.toHaveBeenCalled();
  });

  it("rejects a non-owner (archive stays OWNER-only)", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OTHER_USER_ID,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, name: "Cognitive Assessment", status: "DRAFT" }],
    });

    const result = await archiveForm({ formId: FORM_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
    expect(updateMarkerForm).not.toHaveBeenCalled();
  });
});
