import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const findUniqueUser = vi.fn();
const createMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    markerForm: { create: (...args: unknown[]) => createMarkerForm(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: 1, session: {} })),
}));

// revalidatePath requires a real Next.js request/rendering context that
// doesn't exist when calling a "use server" action directly in a unit test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createForm } from "./createForm";

describe("createForm identity minting", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    createMarkerForm.mockReset();
    findUniqueUser.mockResolvedValue({ firstName: "Jane", lastName: "Doe", orcid: null });
    let nextId = 1;
    createMarkerForm.mockImplementation(async ({ data }) => ({ id: nextId++, ...data }));
  });

  it("mints an opaque familyId on the new MarkerForm and a draft versionId on its v1", async () => {
    const result = await createForm({ title: "Test form" });

    expect(result.ok).toBe(true);
    const call = createMarkerForm.mock.calls[0][0];
    expect(call.data.familyId).toMatch(/^mf_[0-9a-z]{10}$/);
    expect(call.data.versions.create.versionId).toMatch(/^mv_[0-9a-z]{10}$/);
  });

  it("starts native creation Core-only (semantics explicitly absent)", async () => {
    await createForm({ title: "Test form" });

    const call = createMarkerForm.mock.calls[0][0];
    expect(call.data.versions.create.semantics).toBe(Prisma.JsonNull);
  });

  it("mints a distinct familyId per created form — this is the one code path allowed to mint a new family identity", async () => {
    await createForm({ title: "Form A" });
    await createForm({ title: "Form B" });

    const familyIdA = createMarkerForm.mock.calls[0][0].data.familyId;
    const familyIdB = createMarkerForm.mock.calls[1][0].data.familyId;
    expect(familyIdA).not.toEqual(familyIdB);
  });

  it("seeds the initial contributor's affiliation from the user's institution", async () => {
    findUniqueUser.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      orcid: "0000-0002-1825-0097",
      institution: "Analytical Engines Ltd",
    });

    await createForm({ title: "Test form" });

    const call = createMarkerForm.mock.calls[0][0];
    const [contributor] = call.data.versions.create.publicationMetadata.create.contributors;
    expect(contributor.givenName).toBe("Jane");
    expect(contributor.familyName).toBe("Doe");
    expect(contributor.orcid).toBe("0000-0002-1825-0097");
    expect(contributor.affiliations).toEqual([{ name: "Analytical Engines Ltd" }]);
  });

  it("omits the affiliation when the user has no institution set", async () => {
    findUniqueUser.mockResolvedValue({ firstName: "Jane", lastName: "Doe", orcid: null, institution: null });

    await createForm({ title: "Test form" });

    const call = createMarkerForm.mock.calls[0][0];
    const [contributor] = call.data.versions.create.publicationMetadata.create.contributors;
    expect(contributor.affiliations).toEqual([]);
  });
});
