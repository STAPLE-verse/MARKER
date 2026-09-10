import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const OWNER_ID = 1;
const OTHER_AUTHOR_ID = 2;
const PID = "ps_original123";

const findUniquePublishedSchema = vi.fn();
const findUniqueUser = vi.fn();
const createMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: { findUnique: (...args: unknown[]) => findUniquePublishedSchema(...args) },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    markerForm: { create: (...args: unknown[]) => createMarkerForm(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { forkSchema } from "./forkSchema";

const SEMANTICS = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };

function publishedRow(overrides: Record<string, unknown> = {}) {
  return {
    pid: PID,
    title: "Cognitive Assessment Template",
    authorId: OTHER_AUTHOR_ID,
    schemaJson: { type: "object", title: "Cognitive Assessment Template", properties: {} },
    uiSchema: { "ui:order": ["*"] },
    packageSnapshot: {
      packageJson: {
        form: {
          schema: { $schema: "http://json-schema.org/draft-07/schema#", type: "object", title: "Cognitive Assessment Template", properties: {} },
          uiSchema: { "ui:order": ["*"] },
        },
        semantics: SEMANTICS,
      },
    },
    ...overrides,
  };
}

describe("forkSchema", () => {
  beforeEach(() => {
    findUniquePublishedSchema.mockReset();
    findUniqueUser.mockReset();
    createMarkerForm.mockReset();

    findUniqueUser.mockResolvedValue({ firstName: "Jane", lastName: "Doe", orcid: null });
    createMarkerForm.mockImplementation(async ({ data }) => ({ id: 42, ...data }));
  });

  it("returns NOT_FOUND when the published schema doesn't exist", async () => {
    findUniquePublishedSchema.mockResolvedValue(null);

    const result = await forkSchema({ publishedSchemaPid: "ps_missing" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(createMarkerForm).not.toHaveBeenCalled();
  });

  it("rejects forking a schema the caller authored themselves, even if the button wouldn't be shown", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow({ authorId: OWNER_ID }));

    const result = await forkSchema({ publishedSchemaPid: PID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
    expect(createMarkerForm).not.toHaveBeenCalled();
  });

  it("creates a FORKED-origin MarkerForm recording forkedFromPid/forkedAt", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    const result = await forkSchema({ publishedSchemaPid: PID });

    expect(result.ok).toBe(true);
    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.origin).toBe("FORKED");
    expect(data.forkedFromPid).toBe(PID);
    expect(data.forkedAt).toBeInstanceOf(Date);
  });

  it("mints a fresh familyId/versionId — a fork is an independent new draft, not a continuation", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    await forkSchema({ publishedSchemaPid: PID });

    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.familyId).toMatch(/^mf_[0-9a-z]{10}$/);
    expect(data.versions.create.versionId).toMatch(/^mv_[0-9a-z]{10}$/);
  });

  it("reads schema/uiSchema/semantics from the frozen packageSnapshot, not the bare PublishedSchema columns", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    await forkSchema({ publishedSchemaPid: PID });

    const data = createMarkerForm.mock.calls[0][0].data;
    // The package's copy carries the injected $schema dialect key the bare
    // schemaJson column doesn't have — proves the package was the source.
    expect(data.versions.create.schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(data.versions.create.uiSchema).toEqual({ "ui:order": ["*"] });
    expect(data.versions.create.semantics).toEqual(SEMANTICS);
  });

  it("renames the copy's title, matching cloneFormVersion's convention", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    await forkSchema({ publishedSchemaPid: PID });

    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.versions.create.name).toBe("Copy of Cognitive Assessment Template");
    expect(data.versions.create.schema.title).toBe("Copy of Cognitive Assessment Template");
  });

  it("starts fresh publication metadata (forker as sole Creator), not copied from the source", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    await forkSchema({ publishedSchemaPid: PID });

    const metadata = createMarkerForm.mock.calls[0][0].data.versions.create.publicationMetadata.create;
    expect(metadata.contributors).toEqual([
      expect.objectContaining({ name: "Jane Doe", roles: expect.arrayContaining(["Creator"]) }),
    ]);
  });

  it("falls back to Core-only content when packageSnapshot is missing (legacy row)", async () => {
    findUniquePublishedSchema.mockResolvedValue(
      publishedRow({ packageSnapshot: null })
    );

    await forkSchema({ publishedSchemaPid: PID });

    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.versions.create.schema.$schema).toBeUndefined();
    expect(data.versions.create.semantics).toBe(Prisma.JsonNull);
  });
});
