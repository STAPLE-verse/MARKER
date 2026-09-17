import { describe, expect, it, vi, beforeEach } from "vitest";

const countNotification = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      count: (...args: unknown[]) => countNotification(...args),
    },
  },
}));

import { getUnreadNotificationsCount } from "./getUnreadNotificationsCount";

describe("getUnreadNotificationsCount", () => {
  beforeEach(() => {
    countNotification.mockReset();
    countNotification.mockResolvedValue(0);
  });

  it("scopes the count to the given user's own recipient rows", async () => {
    await getUnreadNotificationsCount(42);

    expect(countNotification).toHaveBeenCalledWith({
      where: { recipients: { some: { id: 42 } }, read: false, source: "MARKER" },
    });
  });

  it("returns whatever prisma resolves", async () => {
    countNotification.mockResolvedValue(3);

    expect(await getUnreadNotificationsCount(1)).toBe(3);
  });
});
