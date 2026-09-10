import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyPublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: {
      findMany: (...args: unknown[]) => findManyPublishedSchema(...args),
    },
  },
}));

import { getUserPublishedSchemas } from "./getUserPublishedSchemas";

function row(overrides: Record<string, unknown> = {}) {
  return {
    pid: "ps_1",
    title: "Schema",
    version: "1.0.0",
    familyId: "fam_1",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getUserPublishedSchemas", () => {
  beforeEach(() => {
    findManyPublishedSchema.mockReset();
    findManyPublishedSchema.mockResolvedValue([]);
  });

  it("scopes the query to the given user's own published schemas only", async () => {
    await getUserPublishedSchemas(42);

    expect(findManyPublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: 42 } })
    );
  });

  it("returns an empty list for a user who has never published", async () => {
    expect(await getUserPublishedSchemas(1)).toEqual([]);
  });

  it("collapses multiple published versions of the same family down to the newest one", async () => {
    findManyPublishedSchema.mockResolvedValue([
      row({ pid: "ps_v2", version: "2.0.0", familyId: "fam_1", createdAt: new Date("2026-09-05T00:00:00.000Z") }),
      row({ pid: "ps_v1", version: "1.0.0", familyId: "fam_1", createdAt: new Date("2026-01-01T00:00:00.000Z") }),
    ]);

    const result = await getUserPublishedSchemas(1);

    expect(result).toEqual([
      { pid: "ps_v2", title: "Schema", version: "2.0.0", createdAt: new Date("2026-09-05T00:00:00.000Z") },
    ]);
  });

  it("keeps separate families as separate rows, newest publish first", async () => {
    findManyPublishedSchema.mockResolvedValue([
      row({ pid: "ps_b", title: "B", familyId: "fam_b", createdAt: new Date("2026-09-05T00:00:00.000Z") }),
      row({ pid: "ps_a", title: "A", familyId: "fam_a", createdAt: new Date("2026-09-01T00:00:00.000Z") }),
    ]);

    const result = await getUserPublishedSchemas(1);

    expect(result.map((r) => r.pid)).toEqual(["ps_b", "ps_a"]);
  });
});
