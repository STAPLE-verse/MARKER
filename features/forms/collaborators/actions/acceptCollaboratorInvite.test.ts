import { describe, expect, it, vi, beforeEach } from "vitest";

const INVITEE_ID = 3;
const OTHER_USER_ID = 99;
const COLLABORATOR_ID = 50;
const FORM_ID = 1;

const findUniqueMarkerFormCollaborator = vi.fn();
const updateMarkerFormCollaborator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      update: (...args: unknown[]) => updateMarkerFormCollaborator(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: INVITEE_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { acceptCollaboratorInvite } from "./acceptCollaboratorInvite";

describe("acceptCollaboratorInvite", () => {
  beforeEach(() => {
    findUniqueMarkerFormCollaborator.mockReset();
    updateMarkerFormCollaborator.mockReset();
  });

  it("accepts a pending invite addressed to the caller", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: COLLABORATOR_ID,
      userId: INVITEE_ID,
      formId: FORM_ID,
      acceptedAt: null,
    });

    const result = await acceptCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(true);
    expect(updateMarkerFormCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: COLLABORATOR_ID }, data: { acceptedAt: expect.any(Date) } })
    );
  });

  it("rejects accepting someone else's invite", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: COLLABORATOR_ID,
      userId: OTHER_USER_ID,
      formId: FORM_ID,
      acceptedAt: null,
    });

    const result = await acceptCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(updateMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("rejects accepting an already-accepted invite", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({
      id: COLLABORATOR_ID,
      userId: INVITEE_ID,
      formId: FORM_ID,
      acceptedAt: new Date(),
    });

    const result = await acceptCollaboratorInvite({ collaboratorId: COLLABORATOR_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONFLICT");
  });
});
