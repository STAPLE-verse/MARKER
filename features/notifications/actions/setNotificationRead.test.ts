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

import { setNotificationRead } from "./setNotificationRead";

describe("setNotificationRead", () => {
  beforeEach(() => {
    updateManyNotification.mockReset();
  });

  it("scopes the update to the caller's own recipient rows, not just the notification id", async () => {
    updateManyNotification.mockResolvedValue({ count: 1 });

    await setNotificationRead({ notificationId: 5, read: true });

    expect(updateManyNotification).toHaveBeenCalledWith({
      where: { id: 5, recipients: { some: { id: USER_ID } } },
      data: { read: true },
    });
  });

  it("can set read back to false — this is a toggle, not just mark-as-read", async () => {
    updateManyNotification.mockResolvedValue({ count: 1 });

    await setNotificationRead({ notificationId: 5, read: false });

    expect(updateManyNotification).toHaveBeenCalledWith(
      expect.objectContaining({ data: { read: false } })
    );
  });

  it("returns NOT_FOUND when the notification doesn't belong to the caller (or doesn't exist)", async () => {
    updateManyNotification.mockResolvedValue({ count: 0 });

    const result = await setNotificationRead({ notificationId: 999, read: true });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});
