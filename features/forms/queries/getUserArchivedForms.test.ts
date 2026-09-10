import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: {
      findMany: (...args: unknown[]) => findManyMarkerForm(...args),
    },
  },
}));

import { getUserArchivedForms } from "./getUserArchivedForms";

describe("getUserArchivedForms", () => {
  beforeEach(() => {
    findManyMarkerForm.mockReset();
    findManyMarkerForm.mockResolvedValue([]);
  });

  it("scopes the query to the given user's own, archived forms only", async () => {
    await getUserArchivedForms(42);

    expect(findManyMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 42, archived: true },
      })
    );
  });

  it("passes a different userId straight through without widening the filter", async () => {
    await getUserArchivedForms(7);

    expect(findManyMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 7, archived: true },
      })
    );
  });

  it("returns whatever prisma resolves, unmodified", async () => {
    const rows = [{ id: 1, versions: [] }];
    findManyMarkerForm.mockResolvedValue(rows);

    expect(await getUserArchivedForms(1)).toBe(rows);
  });
});
