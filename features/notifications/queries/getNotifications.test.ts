import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyNotification = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => findManyNotification(...args),
    },
  },
}));

import { getNotifications } from "./getNotifications";

describe("getNotifications", () => {
  beforeEach(() => {
    findManyNotification.mockReset();
    findManyNotification.mockResolvedValue([]);
  });

  it("scopes the query to the given user's own recipient rows only, read and unread alike", async () => {
    await getNotifications(42);

    expect(findManyNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipients: { some: { id: 42 } } },
      })
    );
  });

  it("takes no where-shaped input at all — there's nothing for a caller to widen", async () => {
    // getNotifications's signature is (userId: number) — this test exists to
    // document that constraint, not to exercise new behavior.
    expect(getNotifications.length).toBe(1);
  });

  it("returns an empty list for a user with no notifications", async () => {
    expect(await getNotifications(1)).toEqual([]);
  });
});
