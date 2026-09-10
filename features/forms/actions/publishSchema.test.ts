import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const FORM_ID = 1;
const VERSION_ID = 10;
const OWNER_ID = 1;
const UPDATED_AT = new Date("2026-09-01T00:00:00.000Z");
const FAMILY_ID = "mf_realstoredid01";

const findUniqueMarkerForm = vi.fn();
const findUniquePublicationMetadata = vi.fn();
const updateMany = vi.fn();
const createPublishedSchema = vi.fn();
const createPublishedSchemaPackage = vi.fn();
const queryRaw = vi.fn();

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormVersion: { updateMany: (...args: unknown[]) => updateMany(...args) },
    publicationMetadata: { findUnique: (...args: unknown[]) => findUniquePublicationMetadata(...args) },
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

// publishSchema now reads PublicationMetadata from the DB (written earlier by
// the wizard's Steps 1-2 / the draft card, via savePublicationMetadata)
// instead of accepting it as part of the publish payload — see
// docs/refactor/publish-wizard-refactor.md, Phase 2.
function basePublishInput(overrides: Record<string, unknown> = {}) {
  return {
    formId: FORM_ID,
    formVersionId: VERSION_ID,
    expectedUpdatedAt: UPDATED_AT.toISOString(),
    version: "1.0.0",
    description: "A catalog-facing description for other researchers.",
    ...overrides,
  };
}

function mockPublicationMetadata(overrides: Record<string, unknown> = {}) {
  findUniquePublicationMetadata.mockResolvedValue({
    updatedAt: UPDATED_AT,
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    keywords: ["memory"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    ...overrides,
  });
}

function mockFormWithSchema(
  schema: Record<string, unknown>,
  semantics: unknown = null,
  originOverrides: Record<string, unknown> = {}
) {
  findUniqueMarkerForm.mockResolvedValue({
    id: FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    familyId: FAMILY_ID,
    origin: "NATIVE",
    forkedFromPid: null,
    ...originOverrides,
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
        semantics,
      },
    ],
  });
}

describe("publishSchema identity + template-package validation gate", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findUniquePublicationMetadata.mockReset();
    updateMany.mockReset();
    createPublishedSchema.mockReset();
    createPublishedSchemaPackage.mockReset();
    queryRaw.mockReset();

    updateMany.mockResolvedValue({ count: 1 });
    mockPublicationMetadata();
    createPublishedSchema.mockImplementation(async ({ data }) => data);
    createPublishedSchemaPackage.mockImplementation(async ({ data }) => data);
    queryRaw.mockResolvedValue([]);
  });

  it("publishes using the real stored MarkerForm.familyId, not an ad-hoc value", async () => {
    mockFormWithSchema({ type: "object", properties: {} });

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(true);
    const data = createPublishedSchema.mock.calls[0][0].data;
    expect(data.familyId).toBe(FAMILY_ID);
  });

  it("blocks publish when the wizard's Description field is empty — now caught by zod, not the runtime gate", async () => {
    mockFormWithSchema({ type: "object", properties: {} });

    const result = await publishSchema(basePublishInput({ description: "" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION");
      expect(result.fieldErrors?.description).toContain("A description is required");
    }
    expect(updateMany).not.toHaveBeenCalled();
    expect(createPublishedSchema).not.toHaveBeenCalled();
    expect(createPublishedSchemaPackage).not.toHaveBeenCalled();
  });

  it("uses the wizard's Description field, not the schema's own description — the two are independent", async () => {
    mockFormWithSchema({ type: "object", description: "Form-facing instructions for people filling this out.", properties: {} });

    await publishSchema(basePublishInput({ description: "Catalog-facing summary for other researchers." }));

    const publishedData = createPublishedSchema.mock.calls[0][0].data;
    const packageData = createPublishedSchemaPackage.mock.calls[0][0].data;

    expect(publishedData.description).toBe("Catalog-facing summary for other researchers.");
    expect(packageData.packageJson.metadata.description).toBe("Catalog-facing summary for other researchers.");
  });

  it("succeeds and stores no Creator-role requirement — reflects the rc.4 spec change", async () => {
    mockFormWithSchema({ type: "object", properties: {} });
    mockPublicationMetadata({ contributors: [{ name: "Jane Doe", roles: ["Editor"] }] });

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(true);
  });

  it("blocks publish when PublicationMetadata is missing required fields — reads the DB row, not the payload", async () => {
    mockFormWithSchema({ type: "object", properties: {} });
    findUniquePublicationMetadata.mockResolvedValue(null);

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
    expect(createPublishedSchema).not.toHaveBeenCalled();
  });

  it("logs diagnostics and gives actionable guidance when the assembled package fails spec validation despite passing all upstream checks — Phase 3b", async () => {
    // Structurally broken semantics: everything upstream (zod on metadata,
    // zod on the review fields) is valid, so this can only be caught here,
    // by the runtime spec validator itself.
    mockFormWithSchema({ type: "object", properties: {} }, { bindings: "not-an-array" });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION");
      expect(result.error).toContain("even though it passed the earlier checks");
      expect(result.error).toContain("contact support");
    }
    expect(updateMany).not.toHaveBeenCalled();
    expect(createPublishedSchema).not.toHaveBeenCalled();
    expect(createPublishedSchemaPackage).not.toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed marker-template-spec validation"),
      expect.objectContaining({
        formId: FORM_ID,
        formVersionId: VERSION_ID,
        diagnostics: expect.any(Array),
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("freezes the exact validated package into PublishedSchemaPackage, keyed by pid", async () => {
    mockFormWithSchema({ type: "object", properties: {} });

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

  // Reproduces the exact error shape captured live against this project's DB
  // (@prisma/adapter-pg, Prisma 7.8.0): `meta.target` absent, field names
  // only present in `message` and in the undocumented
  // `meta.driverAdapterError.cause.constraint.fields` path.
  function familyIdVersionConflictError() {
    return new Prisma.PrismaClientKnownRequestError(
      'Invalid `prisma.publishedSchema.create()` invocation:\n\n\nUnique constraint failed on the fields: (`"familyId"`, `version`)',
      {
        code: "P2002",
        clientVersion: "7.8.0",
        meta: {
          modelName: "PublishedSchema",
          driverAdapterError: {
            cause: {
              originalCode: "23505",
              originalMessage:
                'duplicate key value violates unique constraint "PublishedSchema_familyId_version_key"',
              kind: "UniqueConstraintViolation",
              constraint: { fields: ['"familyId"', "version"] },
            },
          },
        },
      }
    );
  }

  it("shows a friendly conflict message when this version was already published, even though meta.target isn't populated under the pg driver adapter", async () => {
    mockFormWithSchema({ type: "object", properties: {} });
    createPublishedSchema.mockRejectedValue(familyIdVersionConflictError());

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.error).toContain("already been published for this schema");
    }
    // Fails fast on the real conflict — must not burn through the PID retry
    // loop (which is for pid collisions, a different P2002 case entirely).
    expect(createPublishedSchema).toHaveBeenCalledTimes(1);
  });

  it("carries derivedFromPid forward from a forked-origin form", async () => {
    mockFormWithSchema(
      { type: "object", properties: {} },
      null,
      { origin: "FORKED", forkedFromPid: "ps_original123" }
    );

    await publishSchema(basePublishInput());

    const data = createPublishedSchema.mock.calls[0][0].data;
    expect(data.derivedFromPid).toBe("ps_original123");
  });

  it("leaves derivedFromPid null for a native (non-forked) form", async () => {
    mockFormWithSchema({ type: "object", properties: {} });

    await publishSchema(basePublishInput());

    const data = createPublishedSchema.mock.calls[0][0].data;
    expect(data.derivedFromPid).toBeNull();
  });

  it("still retries on a genuine pid collision, not just any P2002", async () => {
    mockFormWithSchema({ type: "object", properties: {} });
    const pidCollisionError = new Prisma.PrismaClientKnownRequestError(
      "Invalid `prisma.publishedSchema.create()` invocation:\n\n\nUnique constraint failed on the fields: (`pid`)",
      {
        code: "P2002",
        clientVersion: "7.8.0",
        meta: { modelName: "PublishedSchema", target: ["pid"] },
      }
    );
    createPublishedSchema.mockRejectedValue(pidCollisionError);

    const result = await publishSchema(basePublishInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNKNOWN");
    }
    // MAX_PID_ATTEMPTS = 5 in publishSchema.ts.
    expect(createPublishedSchema).toHaveBeenCalledTimes(5);
  });
});
