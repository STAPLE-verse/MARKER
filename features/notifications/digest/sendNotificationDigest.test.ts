import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyUsers = vi.fn();
const sendEmail = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { user: { findMany: (...args: unknown[]) => findManyUsers(...args) } },
}));

vi.mock("@/lib/mailer", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { sendNotificationDigest } from "./sendNotificationDigest";

const NOW = new Date("2026-09-30T12:00:00.000Z");

describe("sendNotificationDigest", () => {
  beforeEach(() => {
    findManyUsers.mockReset();
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ success: true });
  });

  it("asks only for people whose STAPLE profile is set to this frequency, with MARKER notifications from the last 24 hours", async () => {
    findManyUsers.mockResolvedValue([]);

    await sendNotificationDigest("DAILY", { now: NOW, delayMs: 0 });

    const recent = { source: "MARKER", createdAt: { gte: new Date("2026-09-29T12:00:00.000Z") } };
    expect(findManyUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { emailProjectActivityFrequency: "DAILY", notifications: { some: recent } },
        select: expect.objectContaining({
          notifications: expect.objectContaining({ where: recent }),
        }),
      })
    );
  });

  it("looks back seven days for the weekly run", async () => {
    findManyUsers.mockResolvedValue([]);

    await sendNotificationDigest("WEEKLY", { now: NOW, delayMs: 0 });

    const where = findManyUsers.mock.calls[0][0].where;
    expect(where.emailProjectActivityFrequency).toBe("WEEKLY");
    expect(where.notifications.some.createdAt.gte).toEqual(new Date("2026-09-23T12:00:00.000Z"));
  });

  it("sends each person one email listing their notifications, linked to where they point", async () => {
    findManyUsers.mockResolvedValue([
      {
        email: "ada@example.com",
        notifications: [
          { message: 'jane made a copy of your schema "Stroop".', routeData: { path: "/collection/5" } },
          { message: "No link on this one.", routeData: null },
        ],
      },
      { email: "bob@example.com", notifications: [{ message: "Hello Bob.", routeData: null }] },
    ]);

    const result = await sendNotificationDigest("DAILY", { now: NOW, delayMs: 0 });

    expect(result).toEqual({ frequency: "DAILY", recipients: 2, sent: 2, failed: 0 });
    const msg = sendEmail.mock.calls[0][0];
    expect(msg.to).toBe("ada@example.com");
    expect(msg.subject).toBe("MARKER Daily Notifications");
    expect(msg.html).toContain("/collection/5");
    expect(msg.html).toContain("jane made a copy of your schema &quot;Stroop&quot;.");
    expect(msg.html).toContain("<li>No link on this one.</li>");
    expect(sendEmail.mock.calls[1][0].to).toBe("bob@example.com");
  });

  it("sends nothing when nobody has anything new", async () => {
    findManyUsers.mockResolvedValue([]);

    const result = await sendNotificationDigest("WEEKLY", { now: NOW, delayMs: 0 });

    expect(result).toEqual({ frequency: "WEEKLY", recipients: 0, sent: 0, failed: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("counts a failed send and carries on with the next person", async () => {
    findManyUsers.mockResolvedValue([
      { email: "ada@example.com", notifications: [{ message: "One.", routeData: null }] },
      { email: "bob@example.com", notifications: [{ message: "Two.", routeData: null }] },
    ]);
    sendEmail.mockResolvedValueOnce({ success: false, error: "down" });

    const result = await sendNotificationDigest("DAILY", { now: NOW, delayMs: 0 });

    expect(result).toEqual({ frequency: "DAILY", recipients: 2, sent: 1, failed: 1 });
  });
});
