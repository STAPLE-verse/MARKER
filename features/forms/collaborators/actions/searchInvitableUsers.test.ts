import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const OTHER_USER_ID = 2;

const findUniqueMarkerForm = vi.fn();
const findManyMarkerFormCollaborator = vi.fn();
const findManyUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
    user: { findMany: (...args: unknown[]) => findManyUser(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

import { searchInvitableUsers } from "./searchInvitableUsers";

describe("searchInvitableUsers", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findManyMarkerFormCollaborator.mockReset();
    findManyUser.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, status: "DRAFT" }],
    });
    findManyMarkerFormCollaborator.mockResolvedValue([]);
    findManyUser.mockResolvedValue([
      { id: 5, username: "jane_doe", firstName: "Jane", lastName: "Doe", email: "jane@example.com", gravatar: null },
    ]);
  });

  it("does a prefix match for a username-shaped query", async () => {
    const result = await searchInvitableUsers({ formId: FORM_ID, query: "jan" });

    expect(result.ok).toBe(true);
    expect(findManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ username: { startsWith: "jan", mode: "insensitive" } }),
      })
    );
  });

  it("does an exact match, not a substring match, for an email-shaped query", async () => {
    const result = await searchInvitableUsers({ formId: FORM_ID, query: "jane@example.com" });

    expect(result.ok).toBe(true);
    expect(findManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email: { equals: "jane@example.com", mode: "insensitive" } }),
      })
    );
  });

  it("returns no results and skips the DB for a too-short query", async () => {
    const result = await searchInvitableUsers({ formId: FORM_ID, query: "j" });

    expect(result).toEqual({ ok: true, data: [] });
    expect(findManyUser).not.toHaveBeenCalled();
  });

  it("excludes the owner and existing collaborators from results", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([{ userId: 7 }]);

    await searchInvitableUsers({ formId: FORM_ID, query: "jan" });

    expect(findManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: [OWNER_ID, 7] } }),
      })
    );
  });

  it("rejects a non-owner", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OTHER_USER_ID,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, status: "DRAFT" }],
    });

    const result = await searchInvitableUsers({ formId: FORM_ID, query: "jan" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });
});
