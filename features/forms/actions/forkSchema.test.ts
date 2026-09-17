import { describe, expect, it, vi, beforeEach } from "vitest";

const OWNER_ID = 1;
const OTHER_AUTHOR_ID = 2;
const PID = "ps_original123";

const findUniquePublishedSchema = vi.fn();
const findUniqueUser = vi.fn();
const createMarkerForm = vi.fn();
const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    publishedSchema: { findUnique: (...args: unknown[]) => findUniquePublishedSchema(...args) },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    markerForm: { create: (...args: unknown[]) => createMarkerForm(...args) },
    notification: { create: (...args: unknown[]) => createNotificationRow(...args) },
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
    originFormVersion: { formId: 7 },
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
    createNotificationRow.mockReset();

    findUniqueUser.mockResolvedValue({ username: "jane_doe", firstName: "Jane", lastName: "Doe", orcid: null });
    createMarkerForm.mockImplementation(async ({ data }) => ({ id: 42, ...data }));
  });

  it("returns NOT_FOUND when the published schema doesn't exist", async () => {
    findUniquePublishedSchema.mockResolvedValue(null);

    const result = await forkSchema({ publishedSchemaPid: "ps_missing" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(createMarkerForm).not.toHaveBeenCalled();
  });

  it("allows forking a schema the caller authored themselves — a legitimate way to get explicit lineage a plain clone wouldn't have", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow({ authorId: OWNER_ID }));

    const result = await forkSchema({ publishedSchemaPid: PID });

    expect(result.ok).toBe(true);
    expect(createMarkerForm).toHaveBeenCalled();
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

  it("rejects forking a published schema with no package snapshot", async () => {
    findUniquePublishedSchema.mockResolvedValue(
      publishedRow({ packageSnapshot: null })
    );

    const result = await forkSchema({ publishedSchemaPid: PID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
    expect(createMarkerForm).not.toHaveBeenCalled();
  });

  it("notifies the original author, linking back to their own draft", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow());

    await forkSchema({ publishedSchemaPid: PID });

    expect(createNotificationRow).toHaveBeenCalledWith({
      data: {
        message: 'jane_doe forked your schema "Cognitive Assessment Template".',
        routeData: { path: "/collection/7" },
        recipients: { connect: [{ id: OTHER_AUTHOR_ID }] },
        source: "MARKER",
      },
    });
  });

  it("falls back to the public catalog link when the original author's draft is gone", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow({ originFormVersion: null }));

    await forkSchema({ publishedSchemaPid: PID });

    expect(createNotificationRow).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ routeData: { path: `/schemas/${PID}` } }),
      })
    );
  });

  it("does not notify anyone when the fork is rejected outright (missing schema)", async () => {
    findUniquePublishedSchema.mockResolvedValue(null);
    await forkSchema({ publishedSchemaPid: "ps_missing" });

    expect(createNotificationRow).not.toHaveBeenCalled();
  });

  it("does not notify yourself when forking your own published schema", async () => {
    findUniquePublishedSchema.mockResolvedValue(publishedRow({ authorId: OWNER_ID }));

    await forkSchema({ publishedSchemaPid: PID });

    expect(createNotificationRow).not.toHaveBeenCalled();
  });
});
