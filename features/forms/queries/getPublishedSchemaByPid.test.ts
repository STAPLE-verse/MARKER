import { describe, expect, it, vi, beforeEach } from "vitest";

const findUniquePublishedSchema = vi.fn();
const findManyPublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: {
      findUnique: (...args: unknown[]) => findUniquePublishedSchema(...args),
      findMany: (...args: unknown[]) => findManyPublishedSchema(...args),
    },
  },
}));

import { getPublishedSchemaByPid } from "./getPublishedSchemaByPid";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    pid: "ps_abc123",
    title: "Cognitive Assessment Template",
    description: "A standard protocol.",
    version: "1.0.0",
    license: "CC-BY-4.0",
    domain: "Psychology",
    language: "en",
    keywords: ["cognitive", "assessment"],
    contributors: [{ name: "Jane Doe", roles: ["Creator"] }],
    releaseNotes: null,
    relatedPublicationDoi: null,
    schemaJson: { type: "object" },
    uiSchema: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    familyId: "fam_abc123",
    authorId: 1,
    derivedFromPid: null,
    originFormVersion: null,
    ...overrides,
  };
}

describe("getPublishedSchemaByPid", () => {
  beforeEach(() => {
    findUniquePublishedSchema.mockReset();
    findManyPublishedSchema.mockReset();
    // Sole sibling version by default (the row's own family) — most tests
    // don't care about multi-version behavior, only that it doesn't blow up.
    findManyPublishedSchema.mockResolvedValue([
      { familyId: "fam_abc123", pid: "ps_abc123", version: "1.0.0", createdAt: new Date("2026-09-01T00:00:00.000Z") },
    ]);
  });

  it("returns null when no row matches the pid", async () => {
    findUniquePublishedSchema.mockResolvedValue(null);

    expect(await getPublishedSchemaByPid("ps_missing")).toBeNull();
  });

  it("maps a clean row without logging anything", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findUniquePublishedSchema.mockResolvedValue(baseRow());

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result).toMatchObject({
      pid: "ps_abc123",
      title: "Cognitive Assessment Template",
      keywords: ["cognitive", "assessment"],
      contributors: [{ name: "Jane Doe", roles: ["Creator"] }],
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("logs a warning with the pid when a stored row's contributors need read-time cleanup", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findUniquePublishedSchema.mockResolvedValue(
      baseRow({ contributors: [{ name: "Jane Doe", roles: ["Creator"] }, { name: "  ", roles: [] }] })
    );

    await getPublishedSchemaByPid("ps_abc123");

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][1]).toMatchObject({ pid: "ps_abc123" });

    consoleErrorSpy.mockRestore();
  });

  it("attaches every sibling version in the family, newest first, for the version-history sidebar", async () => {
    findUniquePublishedSchema.mockResolvedValue(baseRow({ pid: "ps_v2", version: "2.0.0" }));
    findManyPublishedSchema.mockResolvedValue([
      { familyId: "fam_abc123", pid: "ps_v2", version: "2.0.0", createdAt: new Date("2026-09-05T00:00:00.000Z") },
      { familyId: "fam_abc123", pid: "ps_v1", version: "1.0.0", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);

    const result = await getPublishedSchemaByPid("ps_v2");

    expect(result?.versions).toEqual([
      { pid: "ps_v2", version: "2.0.0", createdAt: new Date("2026-09-05T00:00:00.000Z") },
      { pid: "ps_v1", version: "1.0.0", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);
    expect(findManyPublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: { in: ["fam_abc123"] } } })
    );
  });

  it("resolves originFormId AND originVersionId from the originFormVersion relation when present", async () => {
    findUniquePublishedSchema.mockResolvedValue(baseRow({ originFormVersion: { id: 55, formId: 7 } }));

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result?.authorId).toBe(1);
    expect(result?.originFormId).toBe(7);
    // The exact MarkerFormVersion this pid was frozen from, not just "a"
    // version of formId 7 — a family can have several published versions,
    // each pointing at a different draft version.
    expect(result?.originVersionId).toBe(55);
  });

  it("returns null originFormId/originVersionId when the origin draft's FK was nulled (onDelete: SetNull) or never existed", async () => {
    findUniquePublishedSchema.mockResolvedValue(baseRow({ originFormVersion: null }));

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result?.originFormId).toBeNull();
    expect(result?.originVersionId).toBeNull();
  });

  it("resolves forkedFrom by a second lookup when derivedFromPid is set", async () => {
    findUniquePublishedSchema
      .mockResolvedValueOnce(baseRow({ derivedFromPid: "ps_original" }))
      .mockResolvedValueOnce({ pid: "ps_original", title: "Original Template" });

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result?.forkedFrom).toEqual({ pid: "ps_original", title: "Original Template" });
    expect(findUniquePublishedSchema).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { pid: "ps_original" } })
    );
  });

  it("leaves forkedFrom null when derivedFromPid is not set, without a second lookup", async () => {
    findUniquePublishedSchema.mockResolvedValue(baseRow());

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result?.forkedFrom).toBeNull();
    expect(findUniquePublishedSchema).toHaveBeenCalledTimes(1);
  });

  it("falls back to an empty object for null schemaJson/uiSchema", async () => {
    findUniquePublishedSchema.mockResolvedValue(baseRow({ schemaJson: null, uiSchema: null }));

    const result = await getPublishedSchemaByPid("ps_abc123");

    expect(result?.schema).toEqual({});
    expect(result?.uiSchema).toEqual({});
  });
});
