import { describe, expect, it, vi, beforeEach } from "vitest";

const INVITEE_ID = 3;
const OTHER_USER_ID = 99;
const COLLABORATOR_ID = 50;

const findUniqueMarkerFormCollaborator = vi.fn();
const deleteMarkerFormCollaborator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      delete: (...args: unknown[]) => deleteMarkerFormCollaborator(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: INVITEE_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { declineCollaboratorInvite } from "./declineCollaboratorInvite";

describe("declineCollaboratorInvite", () => {
  beforeEach(() => {
    findUniqueMarkerFormCollaborator.mockReset();
    deleteMarkerFormCollaborator.mockReset();
  });

  it("deletes a pending invite addressed to the caller", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ id: COLLABORATOR_ID, userId: INVITEE_ID, acceptedAt: null });

    const result = await declineCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(true);
    expect(deleteMarkerFormCollaborator).toHaveBeenCalledWith({ where: { id: COLLABORATOR_ID } });
  });

  it("rejects declining someone else's invite", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ id: COLLABORATOR_ID, userId: OTHER_USER_ID, acceptedAt: null });

    const result = await declineCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(deleteMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("rejects declining an already-accepted row, pointing at 'leave' instead", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: COLLABORATOR_ID,
      userId: INVITEE_ID,
      acceptedAt: new Date(),
    });

    const result = await declineCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.error).toMatch(/leave the form/);
    }
  });
});
