import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = 7;

const findManyMarkerForm = vi.fn();
const findFirstMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: {
      findMany: (...args: unknown[]) => findManyMarkerForm(...args),
      findFirst: (...args: unknown[]) => findFirstMarkerForm(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

import { listCopyableForms } from "./listCopyableForms";
import { getCopyableFormContents } from "./getCopyableFormContents";

describe("listCopyableForms", () => {
  beforeEach(() => {
    findManyMarkerForm.mockReset();
  });

  it("only looks at the signed-in user's own active forms", async () => {
    findManyMarkerForm.mockResolvedValue([]);
    await listCopyableForms({});
    expect(findManyMarkerForm.mock.calls[0]![0].where).toEqual({ ownerId: USER_ID, archived: false });
  });

  it("leaves out the form being edited and forms with no usable version", async () => {
    findManyMarkerForm.mockResolvedValue([
      { id: 1, versions: [{ name: "Earlier study", version: 3 }] },
      { id: 2, versions: [] },
    ]);
    const result = await listCopyableForms({ excludeFormId: 9 });
    expect(findManyMarkerForm.mock.calls[0]![0].where.id).toEqual({ not: 9 });
    expect(result).toEqual({
      ok: true,
      data: [{ id: 1, title: "Earlier study", description: "v3" }],
    });
  });
});

describe("getCopyableFormContents", () => {
  beforeEach(() => {
    findFirstMarkerForm.mockReset();
  });

  it("returns the latest schema of the user's own form", async () => {
    findFirstMarkerForm.mockResolvedValue({
      versions: [{ schema: { type: "object" }, uiSchema: null }],
    });
    const result = await getCopyableFormContents({ formId: 4 });
    expect(findFirstMarkerForm.mock.calls[0]![0].where).toEqual({
      id: 4,
      ownerId: USER_ID,
      archived: false,
    });
    expect(result).toEqual({ ok: true, data: { schema: { type: "object" }, uiSchema: null } });
  });

  it("reports someone else's form (or a missing one) as not found", async () => {
    findFirstMarkerForm.mockResolvedValue(null);
    const result = await getCopyableFormContents({ formId: 4 });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});
