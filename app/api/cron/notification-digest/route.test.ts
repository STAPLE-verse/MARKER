import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const sendNotificationDigest = vi.fn();

vi.mock("@/features/notifications/digest/sendNotificationDigest", () => ({
  sendNotificationDigest: (...args: unknown[]) => sendNotificationDigest(...args),
}));

import { GET } from "./route";

function request(query: string, authorization?: string) {
  return new Request(`http://localhost/api/cron/notification-digest${query}`, {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/cron/notification-digest", () => {
  beforeEach(() => {
    sendNotificationDigest.mockReset();
    sendNotificationDigest.mockResolvedValue({ frequency: "DAILY", recipients: 1, sent: 1, failed: 0 });
    vi.stubEnv("CRON_SECRET", "s3cret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs the digest for the requested frequency when the secret matches", async () => {
    const res = await GET(request("?frequency=weekly", "Bearer s3cret"));

    expect(res.status).toBe(200);
    expect(sendNotificationDigest).toHaveBeenCalledWith("WEEKLY");
    expect(await res.json()).toEqual({ frequency: "DAILY", recipients: 1, sent: 1, failed: 0 });
  });

  it("rejects a missing or wrong secret without sending anything", async () => {
    expect((await GET(request("?frequency=daily"))).status).toBe(401);
    expect((await GET(request("?frequency=daily", "Bearer nope"))).status).toBe(401);
    expect(sendNotificationDigest).not.toHaveBeenCalled();
  });

  it("stays closed when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");

    expect((await GET(request("?frequency=daily", "Bearer "))).status).toBe(401);
    expect(sendNotificationDigest).not.toHaveBeenCalled();
  });

  it("rejects an unknown frequency", async () => {
    const res = await GET(request("?frequency=hourly", "Bearer s3cret"));

    expect(res.status).toBe(400);
    expect(sendNotificationDigest).not.toHaveBeenCalled();
  });
});
