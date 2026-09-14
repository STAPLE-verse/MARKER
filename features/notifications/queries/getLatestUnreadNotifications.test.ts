import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyNotification = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => findManyNotification(...args),
    },
  },
}));

import { getLatestUnreadNotifications } from "./getLatestUnreadNotifications";

describe("getLatestUnreadNotifications", () => {
  beforeEach(() => {
    findManyNotification.mockReset();
    findManyNotification.mockResolvedValue([]);
  });

  it("scopes the query to the given user's own, unread recipient rows only", async () => {
    await getLatestUnreadNotifications(42);

    expect(findManyNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipients: { some: { id: 42 } }, read: false },
      })
    );
  });

  it("maps rows into the list-item DTO, defaulting a null routeData", async () => {
    findManyNotification.mockResolvedValue([
      {
        id: 1,
        message: "jane_doe forked your schema \"Schema\".",
        read: false,
        announcement: false,
        createdAt: new Date("2026-09-10T00:00:00.000Z"),
        routeData: { path: "/collection/5" },
      },
      {
        id: 2,
        message: "System maintenance",
        read: false,
        announcement: true,
        createdAt: new Date("2026-09-09T00:00:00.000Z"),
        routeData: null,
      },
    ]);

    const result = await getLatestUnreadNotifications(1);

    expect(result).toEqual([
      {
        id: 1,
        message: "jane_doe forked your schema \"Schema\".",
        read: false,
        announcement: false,
        createdAt: new Date("2026-09-10T00:00:00.000Z"),
        routeData: { path: "/collection/5" },
      },
      {
        id: 2,
        message: "System maintenance",
        read: false,
        announcement: true,
        createdAt: new Date("2026-09-09T00:00:00.000Z"),
        routeData: null,
      },
    ]);
  });
});
