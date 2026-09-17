import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;

const findManyMarkerFormCollaborator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
  },
}));

import { getFormCollaborators } from "./getFormCollaborators";

describe("getFormCollaborators", () => {
  beforeEach(() => {
    findManyMarkerFormCollaborator.mockReset();
  });

  it("maps a unified list including both pending and accepted rows", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([
      {
        id: 1,
        userId: 10,
        role: "EDITOR",
        acceptedAt: new Date("2026-09-01T00:00:00.000Z"),
        invitedAt: new Date("2026-08-30T00:00:00.000Z"),
        user: { username: "jane_doe", firstName: "Jane", lastName: "Doe", email: "jane@example.com", gravatar: null },
      },
      {
        id: 2,
        userId: 11,
        role: "VIEWER",
        acceptedAt: null,
        invitedAt: new Date("2026-09-02T00:00:00.000Z"),
        user: { username: "john_smith", firstName: null, lastName: null, email: "john@example.com", gravatar: "custom@example.com" },
      },
    ]);

    const result = await getFormCollaborators(FORM_ID);

    expect(result).toEqual([
      {
        collaboratorId: 1,
        userId: 10,
        username: "jane_doe",
        name: "Jane Doe",
        avatarEmail: "jane@example.com",
        role: "EDITOR",
        isPending: false,
        invitedAt: new Date("2026-08-30T00:00:00.000Z"),
      },
      {
        collaboratorId: 2,
        userId: 11,
        username: "john_smith",
        name: null,
        avatarEmail: "custom@example.com",
        role: "VIEWER",
        isPending: true,
        invitedAt: new Date("2026-09-02T00:00:00.000Z"),
      },
    ]);
  });

  it("prefers the gravatar override email over the login email", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([
      {
        id: 1,
        userId: 10,
        role: "EDITOR",
        acceptedAt: new Date(),
        invitedAt: new Date(),
        user: { username: "jane_doe", firstName: null, lastName: null, email: "login@example.com", gravatar: "preferred@example.com" },
      },
    ]);

    const result = await getFormCollaborators(FORM_ID);

    expect(result[0].avatarEmail).toBe("preferred@example.com");
  });
});
