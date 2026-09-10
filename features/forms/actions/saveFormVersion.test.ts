import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const FORM_ID = 1;
const VERSION_ID = 10;
const OWNER_ID = 1;
const UPDATED_AT = new Date("2026-09-01T00:00:00.000Z");

const findUniqueMarkerForm = vi.fn();
const updateMany = vi.fn();
const findUniqueOrThrow = vi.fn();
const queryRaw = vi.fn();

// Only the true I/O boundary (@/lib/db) is mocked — the real locking and
// authorization logic in formVersionConcurrency.ts runs against these mocks,
// so this exercises the actual code path saveFormVersion goes through.
vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormVersion: {
      updateMany: (...args: unknown[]) => updateMany(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
    },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

import { saveFormVersion } from "./saveFormVersion";

describe("saveFormVersion identity invariants", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    updateMany.mockReset();
    findUniqueOrThrow.mockReset();
    queryRaw.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      versions: [{ id: VERSION_ID, version: 1, status: "DRAFT", updatedAt: UPDATED_AT }],
    });
    updateMany.mockResolvedValue({ count: 1 });
    findUniqueOrThrow.mockResolvedValue({ updatedAt: new Date("2026-09-02T00:00:00.000Z") });
    queryRaw.mockResolvedValue([]);
  });

  it("never writes familyId or versionId — an in-place draft edit must not touch identity", async () => {
    const result = await saveFormVersion({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
    });

    expect(result.ok).toBe(true);
    const data = updateMany.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("familyId");
    expect(data).not.toHaveProperty("versionId");
  });

  it("omitting semantics leaves it untouched (not included in the write at all)", async () => {
    await saveFormVersion({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
    });

    const data = updateMany.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("semantics");
  });

  it("an explicit null clears semantics", async () => {
    await saveFormVersion({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
      semantics: null,
    });

    const data = updateMany.mock.calls[0][0].data;
    expect(data.semantics).toBe(Prisma.JsonNull);
  });

  it("a provided semantics object is written verbatim", async () => {
    const semantics = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };

    await saveFormVersion({
      formId: FORM_ID,
      formVersionId: VERSION_ID,
      expectedUpdatedAt: UPDATED_AT.toISOString(),
      schema: { type: "object", properties: {} },
      semantics,
    });

    const data = updateMany.mock.calls[0][0].data;
    expect(data.semantics).toEqual(semantics);
  });
});
