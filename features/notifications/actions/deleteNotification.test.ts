import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const USER_ID = 1;

const updateNotification = vi.fn();
const deleteNotificationRow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      update: (...args: unknown[]) => updateNotification(...args),
      delete: (...args: unknown[]) => deleteNotificationRow(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { deleteNotification } from "./deleteNotification";

function notFoundError() {
  return new Prisma.PrismaClientKnownRequestError("Record to update not found.", {
    code: "P2025",
    clientVersion: "7.8.0",
  });
}

describe("deleteNotification", () => {
  beforeEach(() => {
    updateNotification.mockReset();
    deleteNotificationRow.mockReset();
  });

  it("disconnects the caller from a multi-recipient notification without deleting the row for other recipients", async () => {
    updateNotification.mockResolvedValue({ recipients: [{ id: 50 }] });

    const result = await deleteNotification({ notificationId: 5 });

    expect(result.ok).toBe(true);
    expect(updateNotification).toHaveBeenCalledWith({
      where: { id: 5, recipients: { some: { id: USER_ID } } },
      data: { recipients: { disconnect: { id: USER_ID } } },
      select: { recipients: { select: { id: true } } },
    });
    expect(deleteNotificationRow).not.toHaveBeenCalled();
  });

  it("deletes the row outright once the caller was its last recipient", async () => {
    updateNotification.mockResolvedValue({ recipients: [] });

    await deleteNotification({ notificationId: 5 });

    expect(deleteNotificationRow).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it("returns NOT_FOUND when the notification doesn't belong to the caller (or doesn't exist)", async () => {
    updateNotification.mockRejectedValue(notFoundError());

    const result = await deleteNotification({ notificationId: 999 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(deleteNotificationRow).not.toHaveBeenCalled();
  });

  it("surfaces an unrelated failure as UNKNOWN rather than swallowing it", async () => {
    updateNotification.mockRejectedValue(new Error("connection reset"));

    const result = await deleteNotification({ notificationId: 5 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNKNOWN");
  });
});
