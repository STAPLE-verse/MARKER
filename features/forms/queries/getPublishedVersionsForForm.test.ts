import { describe, expect, it, vi, beforeEach } from "vitest";

const findUniqueMarkerForm = vi.fn();
const findManyPublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    publishedSchema: { findMany: (...args: unknown[]) => findManyPublishedSchema(...args) },
  },
}));

import { getPublishedVersionsForForm } from "./getPublishedVersionsForForm";

describe("getPublishedVersionsForForm", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findManyPublishedSchema.mockReset();
  });

  it("returns an empty array when the form doesn't exist", async () => {
    findUniqueMarkerForm.mockResolvedValue(null);

    const result = await getPublishedVersionsForForm(999);

    expect(result).toEqual([]);
    expect(findManyPublishedSchema).not.toHaveBeenCalled();
  });

  it("looks up the family via the form, then returns that family's published versions", async () => {
    findUniqueMarkerForm.mockResolvedValue({ familyId: "mf_abc123" });
    findManyPublishedSchema.mockResolvedValue([{ version: "1.0.0" }, { version: "1.1.0" }]);

    const result = await getPublishedVersionsForForm(1);

    expect(findUniqueMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(findManyPublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: "mf_abc123" } })
    );
    expect(result).toEqual(["1.0.0", "1.1.0"]);
  });

  it("returns an empty array for a family with no published versions yet", async () => {
    findUniqueMarkerForm.mockResolvedValue({ familyId: "mf_never_published" });
    findManyPublishedSchema.mockResolvedValue([]);

    const result = await getPublishedVersionsForForm(1);

    expect(result).toEqual([]);
  });
});
