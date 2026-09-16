import { describe, expect, it, vi, beforeEach } from "vitest";

const USER_ID = 3;

const findManyMarkerFormCollaborator = vi.fn();
const findManyUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
    user: { findMany: (...args: unknown[]) => findManyUser(...args) },
  },
}));

import { getMyPendingCollaboratorInvites } from "./getMyPendingCollaboratorInvites";

describe("getMyPendingCollaboratorInvites", () => {
  beforeEach(() => {
    findManyMarkerFormCollaborator.mockReset();
    findManyUser.mockReset();
  });

  it("resolves the inviter's username via a second query, since invitedById has no Prisma relation", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([
      {
        id: 1,
        formId: 100,
        role: "EDITOR",
        invitedById: 7,
        invitedAt: new Date("2026-09-01T00:00:00.000Z"),
        form: { versions: [{ name: "Cognitive Assessment" }] },
      },
    ]);
    findManyUser.mockResolvedValue([{ id: 7, username: "jane_doe" }]);

    const result = await getMyPendingCollaboratorInvites(USER_ID);

    expect(findManyUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [7] } } })
    );
    expect(result).toEqual([
      {
        collaboratorId: 1,
        formId: 100,
        formTitle: "Cognitive Assessment",
        role: "EDITOR",
        inviterUsername: "jane_doe",
        invitedAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    ]);
  });

  it("falls back to 'Someone' and skips the second query when there's no inviter", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([
      {
        id: 1,
        formId: 100,
        role: "VIEWER",
        invitedById: null,
        invitedAt: new Date(),
        form: { versions: [] },
      },
    ]);

    const result = await getMyPendingCollaboratorInvites(USER_ID);

    expect(findManyUser).not.toHaveBeenCalled();
    expect(result[0].inviterUsername).toBe("Someone");
    expect(result[0].formTitle).toBe("Untitled Draft");
  });
});
