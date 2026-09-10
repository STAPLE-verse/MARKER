import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyPublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: { findMany: (...args: unknown[]) => findManyPublishedSchema(...args) },
  },
}));

import { searchPublishedSchemas } from "./searchPublishedSchemas";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    pid: "ps_abc123",
    title: "Cognitive Assessment Template",
    description: "A standard protocol.",
    version: "1.0.0",
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    source: "native",
    keywords: ["cognitive", "assessment"],
    contributors: [{ name: "Jane Doe", roles: ["Creator"] }],
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    author: { firstName: "Jane", lastName: "Doe" },
    ...overrides,
  };
}

describe("searchPublishedSchemas", () => {
  beforeEach(() => {
    findManyPublishedSchema.mockReset();
  });

  it("queries distinct per familyId, ordered by newest first, capped", async () => {
    findManyPublishedSchema.mockResolvedValue([]);

    await searchPublishedSchemas();

    expect(findManyPublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ["familyId"],
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    );
  });

  it("maps rows into PublishedSchemaCardDTO shape, without logging for clean data", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findManyPublishedSchema.mockResolvedValue([baseRow()]);

    const result = await searchPublishedSchemas();

    expect(result).toEqual([
      {
        pid: "ps_abc123",
        title: "Cognitive Assessment Template",
        description: "A standard protocol.",
        version: "1.0.0",
        domain: "Psychology",
        language: "en",
        license: "CC-BY-4.0",
        source: "native",
        keywords: ["cognitive", "assessment"],
        contributors: [
          {
            name: "Jane Doe",
            nameType: undefined,
            givenName: undefined,
            familyName: undefined,
            roles: ["Creator"],
            orcid: null,
            affiliations: [],
          },
        ],
        authorName: "Jane Doe",
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    ]);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("logs a warning with the pid when a row's keywords need read-time cleanup", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findManyPublishedSchema.mockResolvedValue([baseRow({ keywords: ["fMRI", "FMRI"] })]);

    await searchPublishedSchemas();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][1]).toMatchObject({ pid: "ps_abc123" });

    consoleErrorSpy.mockRestore();
  });

  it("falls back to the publishing user's name only when contributors is empty", async () => {
    findManyPublishedSchema.mockResolvedValue([
      baseRow({ contributors: [], author: { firstName: "Jane", lastName: "Doe" } }),
    ]);

    const [result] = await searchPublishedSchemas();

    expect(result.contributors).toEqual([]);
    expect(result.authorName).toBe("Jane Doe");
  });

  it("returns null authorName when the publishing user has no first/last name on file", async () => {
    findManyPublishedSchema.mockResolvedValue([baseRow({ author: { firstName: null, lastName: null } })]);

    const [result] = await searchPublishedSchemas();

    expect(result.authorName).toBeNull();
  });
});
