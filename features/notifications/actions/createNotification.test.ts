import { describe, expect, it, vi, beforeEach } from "vitest";

const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => createNotificationRow(...args),
    },
  },
}));

import { createNotification } from "./createNotification";

describe("createNotification", () => {
  beforeEach(() => {
    createNotificationRow.mockReset();
  });

  it("writes a row with the rendered message, routeData, and recipients connected by id", async () => {
    await createNotification({
      recipients: [1, 2],
      kind: "SCHEMA_FORKED",
      data: {
        forkedByUsername: "jane_doe",
        originalTitle: "Schema",
        originalFormId: 5,
        originalPid: "ps_1",
      },
    });

    expect(createNotificationRow).toHaveBeenCalledWith({
      data: {
        message: 'jane_doe forked your schema "Schema".',
        routeData: { path: "/collection/5" },
        recipients: { connect: [{ id: 1 }, { id: 2 }] },
        source: "MARKER",
      },
    });
  });

  it("does nothing when there are no recipients", async () => {
    await createNotification({
      recipients: [],
      kind: "SCHEMA_FORKED",
      data: {
        forkedByUsername: "jane_doe",
        originalTitle: "Schema",
        originalFormId: 5,
        originalPid: "ps_1",
      },
    });

    expect(createNotificationRow).not.toHaveBeenCalled();
  });

  it("rejects a payload that fails the kind's own schema", async () => {
    await expect(
      createNotification({
        recipients: [1],
        kind: "SCHEMA_FORKED",
        // @ts-expect-error deliberately malformed payload
        data: { forkedByUsername: "jane_doe" },
      })
    ).rejects.toThrow();

    expect(createNotificationRow).not.toHaveBeenCalled();
  });
});
