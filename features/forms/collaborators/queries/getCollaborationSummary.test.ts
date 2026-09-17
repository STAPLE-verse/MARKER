import { describe, expect, it, vi, beforeEach } from "vitest";

const OWNER_ID = 1;
const FORM_ID = 100;

const findUniqueOrThrowUser = vi.fn();
const findManyMarkerFormCollaborator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrowUser(...args) },
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
  },
}));

import { getCollaborationSummary } from "./getCollaborationSummary";

describe("getCollaborationSummary", () => {
  beforeEach(() => {
    findUniqueOrThrowUser.mockReset();
    findManyMarkerFormCollaborator.mockReset();
    findManyMarkerFormCollaborator.mockResolvedValue([]);
  });

  it("prefers the owner's gravatar override email over their login email", async () => {
    findUniqueOrThrowUser.mockResolvedValue({
      username: "jane_owner",
      email: "login@example.com",
      gravatar: "preferred@example.com",
    });

    const result = await getCollaborationSummary(FORM_ID, OWNER_ID);

    expect(result.ownerUsername).toBe("jane_owner");
    expect(result.ownerAvatarEmail).toBe("preferred@example.com");
    expect(result.ownerId).toBe(OWNER_ID);
  });

  it("falls back to the login email when there's no gravatar override", async () => {
    findUniqueOrThrowUser.mockResolvedValue({ username: "jane_owner", email: "login@example.com", gravatar: null });

    const result = await getCollaborationSummary(FORM_ID, OWNER_ID);

    expect(result.ownerAvatarEmail).toBe("login@example.com");
  });
});
