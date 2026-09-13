import { describe, expect, it, vi, beforeEach } from "vitest";

const USER_ID = 1;

const countNotification = vi.fn();
const findManyNotification = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      count: (...args: unknown[]) => countNotification(...args),
      findMany: (...args: unknown[]) => findManyNotification(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

import { getNotificationBellData } from "./getNotificationBellData";

describe("getNotificationBellData", () => {
  beforeEach(() => {
    countNotification.mockReset();
    findManyNotification.mockReset();
  });

  it("returns the caller's own unread count and latest-unread list together", async () => {
    countNotification.mockResolvedValue(2);
    findManyNotification.mockResolvedValue([
      { id: 1, message: "m", read: false, announcement: false, createdAt: new Date(), routeData: null },
    ]);

    const result = await getNotificationBellData({});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.unreadCount).toBe(2);
      expect(result.data.latest).toHaveLength(1);
    }
    expect(countNotification).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ recipients: { some: { id: USER_ID } } }) })
    );
  });
});
