import { describe, expect, it, vi, beforeEach } from "vitest";

const SOURCE_VERSION_ID = 10;
const OWNER_ID = 1;
const SOURCE_SEMANTICS = { root: { classIri: "https://schema.org/Thing" }, bindings: [] };

const findUniqueMarkerFormVersion = vi.fn();
const createMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerFormVersion: { findUnique: (...args: unknown[]) => findUniqueMarkerFormVersion(...args) },
    markerForm: { create: (...args: unknown[]) => createMarkerForm(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

// revalidatePath requires a real Next.js request/rendering context that
// doesn't exist when calling a "use server" action directly in a unit test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { cloneFormVersion } from "./cloneFormVersion";

describe("cloneFormVersion identity invariants", () => {
  beforeEach(() => {
    findUniqueMarkerFormVersion.mockReset();
    createMarkerForm.mockReset();

    findUniqueMarkerFormVersion.mockResolvedValue({
      id: SOURCE_VERSION_ID,
      name: "Source form",
      formId: 99,
      schema: { type: "object", title: "Source form", properties: {} },
      uiSchema: {},
      semantics: SOURCE_SEMANTICS,
      form: { id: 99, ownerId: OWNER_ID, familyId: "mf_sourceform01" },
      publicationMetadata: null,
    });
    let nextId = 1;
    createMarkerForm.mockImplementation(async ({ data }) => ({ id: nextId++, ...data }));
  });

  it("mints a NEW familyId — cloning creates an independent new MarkerForm, so it must not inherit the source's identity", async () => {
    const result = await cloneFormVersion({ versionId: SOURCE_VERSION_ID });

    expect(result.ok).toBe(true);
    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.familyId).toMatch(/^mf_[0-9a-z]{10}$/);
    expect(data.familyId).not.toEqual("mf_sourceform01");
  });

  it("mints a NEW versionId for the copied draft version", async () => {
    await cloneFormVersion({ versionId: SOURCE_VERSION_ID });

    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.versions.create.versionId).toMatch(/^mv_[0-9a-z]{10}$/);
  });

  it("copies the source's semantics verbatim — duplicated content, not identity", async () => {
    await cloneFormVersion({ versionId: SOURCE_VERSION_ID });

    const data = createMarkerForm.mock.calls[0][0].data;
    expect(data.versions.create.semantics).toEqual(SOURCE_SEMANTICS);
  });

  it("mints distinct familyIds across two separate clones of the same source", async () => {
    await cloneFormVersion({ versionId: SOURCE_VERSION_ID });
    await cloneFormVersion({ versionId: SOURCE_VERSION_ID });

    const familyId1 = createMarkerForm.mock.calls[0][0].data.familyId;
    const familyId2 = createMarkerForm.mock.calls[1][0].data.familyId;
    expect(familyId1).not.toEqual(familyId2);
  });
});
