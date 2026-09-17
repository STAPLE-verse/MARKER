import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;

const findFirstMarkerForm = vi.fn();
const findManyMarkerFormVersion = vi.fn();
const findUniquePublishedSchema = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findFirst: (...args: unknown[]) => findFirstMarkerForm(...args) },
    markerFormVersion: { findMany: (...args: unknown[]) => findManyMarkerFormVersion(...args) },
    publishedSchema: { findUnique: (...args: unknown[]) => findUniquePublishedSchema(...args) },
  },
}));

import { getFormById } from "./getFormById";

function baseForm(overrides: Record<string, unknown> = {}) {
  return {
    id: FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    origin: "NATIVE",
    forkedFromPid: null,
    importedFromStapleFormId: null,
    importedFromStapleVersionNumber: null,
    importedAt: null,
    originalImportHash: null,
    ...overrides,
  };
}

function baseVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: "Test schema",
    version: 1,
    status: "DRAFT",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    schema: { type: "object" },
    uiSchema: {},
    semantics: null,
    publicationMetadata: null,
    publishedSchemas: [],
    importedFromStapleVersionNumber: null,
    importedAt: null,
    originalImportHash: null,
    isDirectStapleImport: false,
    ...overrides,
  };
}

describe("getFormById — forkedFrom resolution", () => {
  beforeEach(() => {
    findFirstMarkerForm.mockReset();
    findManyMarkerFormVersion.mockReset();
    findUniquePublishedSchema.mockReset();

    findManyMarkerFormVersion.mockResolvedValue([baseVersion()]);
  });

  it("resolves forkedFrom for a FORKED-origin form", async () => {
    findFirstMarkerForm.mockResolvedValue(baseForm({ origin: "FORKED", forkedFromPid: "ps_original" }));
    findUniquePublishedSchema.mockResolvedValue({ pid: "ps_original", title: "Original Template" });

    const result = await getFormById(FORM_ID, OWNER_ID);

    expect(result?.forkedFrom).toEqual({ pid: "ps_original", title: "Original Template" });
    expect(findUniquePublishedSchema).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pid: "ps_original" } })
    );
  });

  it("leaves forkedFrom null for a native form, without looking it up", async () => {
    findFirstMarkerForm.mockResolvedValue(baseForm());

    const result = await getFormById(FORM_ID, OWNER_ID);

    expect(result?.forkedFrom).toBeNull();
    expect(findUniquePublishedSchema).not.toHaveBeenCalled();
  });

  it("leaves forkedFrom null when the origin PublishedSchema row is somehow gone", async () => {
    findFirstMarkerForm.mockResolvedValue(baseForm({ origin: "FORKED", forkedFromPid: "ps_deleted" }));
    findUniquePublishedSchema.mockResolvedValue(null);

    const result = await getFormById(FORM_ID, OWNER_ID);

    expect(result?.forkedFrom).toBeNull();
  });
});

describe("getFormById — role resolution", () => {
  const COLLABORATOR_ID = 7;

  beforeEach(() => {
    findFirstMarkerForm.mockReset();
    findManyMarkerFormVersion.mockReset();
    findUniquePublishedSchema.mockReset();

    findManyMarkerFormVersion.mockResolvedValue([baseVersion()]);
  });

  it("resolves OWNER for the form's owner", async () => {
    findFirstMarkerForm.mockResolvedValue(baseForm({ collaborators: [] }));

    const result = await getFormById(FORM_ID, OWNER_ID);

    expect(result?.role).toBe("OWNER");
  });

  it("resolves the accepted collaborator's own role, not the owner's", async () => {
    findFirstMarkerForm.mockResolvedValue(
      baseForm({ collaborators: [{ role: "EDITOR" }] })
    );

    const result = await getFormById(FORM_ID, COLLABORATOR_ID);

    expect(result?.role).toBe("EDITOR");
  });
});
