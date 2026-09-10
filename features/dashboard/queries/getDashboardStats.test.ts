import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyMarkerForm = vi.fn();
const countMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: {
      findMany: (...args: unknown[]) => findManyMarkerForm(...args),
      count: (...args: unknown[]) => countMarkerForm(...args),
    },
  },
}));

import { getDashboardStats } from "./getDashboardStats";

function formWithStatus(status: "DRAFT" | "PUBLISHED" | undefined) {
  return { versions: status ? [{ status }] : [] };
}

describe("getDashboardStats", () => {
  beforeEach(() => {
    findManyMarkerForm.mockReset();
    countMarkerForm.mockReset();
    countMarkerForm.mockResolvedValue(0);
  });

  it("counts a form with no non-archived versions as a draft, same as the Collection page does", async () => {
    findManyMarkerForm.mockResolvedValue([formWithStatus(undefined)]);

    const result = await getDashboardStats(1);

    expect(result).toEqual({ publishedCount: 0, draftCount: 1, archivedCount: 0 });
  });

  it("splits published vs draft by each form's latest version status", async () => {
    findManyMarkerForm.mockResolvedValue([
      formWithStatus("PUBLISHED"),
      formWithStatus("PUBLISHED"),
      formWithStatus("DRAFT"),
    ]);

    const result = await getDashboardStats(1);

    expect(result).toEqual({ publishedCount: 2, draftCount: 1, archivedCount: 0 });
  });

  it("returns zeroes for a user with no forms", async () => {
    findManyMarkerForm.mockResolvedValue([]);

    const result = await getDashboardStats(1);

    expect(result).toEqual({ publishedCount: 0, draftCount: 0, archivedCount: 0 });
  });

  it("counts archived forms via the same { ownerId, archived: true } filter as the Collection page's Archived tab", async () => {
    findManyMarkerForm.mockResolvedValue([]);
    countMarkerForm.mockResolvedValue(3);

    const result = await getDashboardStats(7);

    expect(countMarkerForm).toHaveBeenCalledWith({ where: { ownerId: 7, archived: true } });
    expect(result.archivedCount).toBe(3);
  });
});
