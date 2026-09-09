import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const VERSION_ID = 10;
const OWNER_ID = 1;
const UPDATED_AT = new Date("2026-09-01T00:00:00.000Z");
const FAMILY_ID = "mf_realstoredid01";

const findUniqueMarkerForm = vi.fn();
const updateMany = vi.fn();
const upsertPublicationMetadata = vi.fn();
const createPublishedSchema = vi.fn();
const createPublishedSchemaPackage = vi.fn();
const queryRaw = vi.fn();

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormVersion: { updateMany: (...args: unknown[]) => updateMany(...args) },
    publicationMetadata: { upsert: (...args: unknown[]) => upsertPublicationMetadata(...args) },
    publishedSchema: { create: (...args: unknown[]) => createPublishedSchema(...args) },
    publishedSchemaPackage: { create: (...args: unknown[]) => createPublishedSchemaPackage(...args) },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { publishSchema } from "./publishSchema";

function basePublishInput(overrides: Record<string, unknown> = {}) {
  return {
    formId: FORM_ID,
    formVersionId: VERSION_ID,
    expectedUpdatedAt: UPDATED_AT.toISOString(),
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    keywords: ["memory"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    version: "1.0.0",
    ...overrides,
  };
}

function mockFormWithSchema(schema: Record<string, unknown>) {
  findUniqueMarkerForm.mockResolvedValue({
    id: FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    familyId: FAMILY_ID,
    versions: [
      {
        id: VERSION_ID,
        version: 1,
        status: "DRAFT",
        updatedAt: UPDATED_AT,
        createdAt: UPDATED_AT,
        name: "Test schema",
        schema,
        uiSchema: {},
        semantics: null,
      },
    ],
  });
}

describe("publishSchema identity + template-package validation gate", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    updateMany.mockReset();
    upsertPublicationMetadata.mockReset();
    createPublishedSchema.mockReset();
    createPublishedSchemaPackage.mockReset();
    queryRaw.mockReset();

    updateMany.mockResolvedValue({ count: 1 });
    upsertPublicationMetadata.mockResolvedValue({});
    createPublishedSchema.mockImplementation(async ({ data }) => data);
    createPublishedSchemaPackage.mockImplementation(async ({ data }) => data);
    queryRaw.mockResolvedValue([]);
  });

  it("publishes using the real stored MarkerForm.familyId, not an ad-hoc value", async () => {
    mockFormWithSchema({ type: "object", description: "A schema with a description.", properties: {} });

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(true);
    const data = createPublishedSchema.mock.calls[0][0].data;
    expect(data.familyId).toBe(FAMILY_ID);
  });

  it("blocks publish when the schema has no description — a Core V1 rule zod alone can't check", async () => {
    mockFormWithSchema({ type: "object", properties: {} });

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION");
    }
    expect(updateMany).not.toHaveBeenCalled();
    expect(createPublishedSchema).not.toHaveBeenCalled();
    expect(createPublishedSchemaPackage).not.toHaveBeenCalled();
  });

  it("succeeds and stores no Creator-role requirement — reflects the rc.4 spec change", async () => {
    mockFormWithSchema({ type: "object", description: "Fine without a Creator role.", properties: {} });

    const result = await publishSchema(
      basePublishInput({ contributors: [{ name: "Jane Doe", roles: ["Editor"] }] })
    );

    expect(result.ok).toBe(true);
  });

  it("freezes the exact validated package into PublishedSchemaPackage, keyed by pid", async () => {
    mockFormWithSchema({ type: "object", description: "A schema with a description.", properties: {} });

    await publishSchema(basePublishInput());

    expect(createPublishedSchemaPackage).toHaveBeenCalledTimes(1);
    const packageData = createPublishedSchemaPackage.mock.calls[0][0].data;
    const publishedData = createPublishedSchema.mock.calls[0][0].data;

    expect(packageData.pid).toBe(publishedData.pid);
    expect(packageData.packageJson).toMatchObject({
      conformsTo: expect.any(Array),
      metadata: expect.objectContaining({ status: "published", familyId: `urn:marker:family:${FAMILY_ID}` }),
      form: expect.objectContaining({ schema: expect.any(Object), uiSchema: expect.any(Object) }),
    });
  });
});
