import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyPublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: { findMany: (...args: unknown[]) => findManyPublishedSchema(...args) },
  },
}));

import { getVersionsByFamilyIds } from "./publishedSchemaFamilyVersions";

describe("getVersionsByFamilyIds", () => {
  beforeEach(() => {
    findManyPublishedSchema.mockReset();
  });

  it("returns an empty map without querying when given no familyIds", async () => {
    const result = await getVersionsByFamilyIds([]);

    expect(result.size).toBe(0);
    expect(findManyPublishedSchema).not.toHaveBeenCalled();
  });

  it("groups rows by familyId, preserving the newest-first order from the query", async () => {
    findManyPublishedSchema.mockResolvedValue([
      { familyId: "fam_a", pid: "ps_a2", version: "2.0.0", createdAt: new Date("2026-09-05T00:00:00.000Z") },
      { familyId: "fam_a", pid: "ps_a1", version: "1.0.0", createdAt: new Date("2026-01-01T00:00:00.000Z") },
      { familyId: "fam_b", pid: "ps_b1", version: "1.0.0", createdAt: new Date("2026-05-01T00:00:00.000Z") },
    ]);

    const result = await getVersionsByFamilyIds(["fam_a", "fam_b"]);

    expect(result.get("fam_a")).toEqual([
      { pid: "ps_a2", version: "2.0.0", createdAt: new Date("2026-09-05T00:00:00.000Z") },
      { pid: "ps_a1", version: "1.0.0", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);
    expect(result.get("fam_b")).toEqual([
      { pid: "ps_b1", version: "1.0.0", createdAt: new Date("2026-05-01T00:00:00.000Z") },
    ]);
    expect(findManyPublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: { in: ["fam_a", "fam_b"] } } })
    );
  });
});
