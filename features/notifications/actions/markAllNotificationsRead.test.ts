import { describe, expect, it, vi, beforeEach } from "vitest";

const USER_ID = 1;

const updateManyNotification = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      updateMany: (...args: unknown[]) => updateManyNotification(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { markAllNotificationsRead } from "./markAllNotificationsRead";

describe("markAllNotificationsRead", () => {
  beforeEach(() => {
    updateManyNotification.mockReset();
    updateManyNotification.mockResolvedValue({ count: 0 });
  });

  it("scopes the bulk update to the caller's own unread recipient rows only", async () => {
    await markAllNotificationsRead({});

    expect(updateManyNotification).toHaveBeenCalledWith({
      where: { recipients: { some: { id: USER_ID } }, read: false, source: "MARKER" },
      data: { read: true },
    });
  });
});
