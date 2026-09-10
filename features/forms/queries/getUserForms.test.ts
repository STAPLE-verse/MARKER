import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: {
      findMany: (...args: unknown[]) => findManyMarkerForm(...args),
    },
  },
}));

import { getUserForms } from "./getUserForms";

describe("getUserForms", () => {
  beforeEach(() => {
    findManyMarkerForm.mockReset();
    findManyMarkerForm.mockResolvedValue([]);
  });

  it("scopes the query to the given user's own, non-archived forms only", async () => {
    await getUserForms(42);

    expect(findManyMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 42, archived: false },
      })
    );
  });

  it("passes a different userId straight through without widening the filter", async () => {
    await getUserForms(7);

    expect(findManyMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 7, archived: false },
      })
    );
  });

  it("returns whatever prisma resolves, unmodified", async () => {
    const rows = [{ id: 1, versions: [] }];
    findManyMarkerForm.mockResolvedValue(rows);

    expect(await getUserForms(1)).toBe(rows);
  });
});
