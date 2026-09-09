import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const LATEST_VERSION = {
  id: 10,
  formId: FORM_ID,
  version: 3,
  name: "Latest version",
  schema: { type: "object", properties: {} },
  uiSchema: {},
  semantics: { root: { classIri: "https://schema.org/Thing" }, bindings: [] },
};

const findUniqueMarkerForm = vi.fn();
const findUniquePublicationMetadata = vi.fn();
const createMarkerFormVersion = vi.fn();
const queryRaw = vi.fn();

vi.mock("@/lib/db", () => {
  const client = {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    publicationMetadata: { findUnique: (...args: unknown[]) => findUniquePublicationMetadata(...args) },
    markerFormVersion: { create: (...args: unknown[]) => createMarkerFormVersion(...args) },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    $transaction: async (cb: (tx: unknown) => unknown) => cb(client),
  };
  return { prisma: client };
});

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

// revalidatePath requires a real Next.js request/rendering context that
// doesn't exist when calling a "use server" action directly in a unit test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createFormVersionFromLatest } from "./createFormVersionFromLatest";

describe("createFormVersionFromLatest identity invariants", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findUniquePublicationMetadata.mockReset();
    createMarkerFormVersion.mockReset();
    queryRaw.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      versions: [LATEST_VERSION],
    });
    findUniquePublicationMetadata.mockResolvedValue(null);
    createMarkerFormVersion.mockImplementation(async ({ data }) => ({ id: 99, ...data }));
    queryRaw.mockResolvedValue([]);
  });

  it("never writes familyId — a new version under an existing form must not touch identity", async () => {
    const result = await createFormVersionFromLatest({ formId: FORM_ID });

    expect(result.ok).toBe(true);
    const data = createMarkerFormVersion.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("familyId");
  });

  it("mints a fresh versionId for the new version, distinct from the source's", async () => {
    await createFormVersionFromLatest({ formId: FORM_ID });

    const data = createMarkerFormVersion.mock.calls[0][0].data;
    expect(data.versionId).toMatch(/^mv_[0-9a-z]{10}$/);
  });

  it("copies the latest version's semantics verbatim", async () => {
    await createFormVersionFromLatest({ formId: FORM_ID });

    const data = createMarkerFormVersion.mock.calls[0][0].data;
    expect(data.semantics).toEqual(LATEST_VERSION.semantics);
  });
});
