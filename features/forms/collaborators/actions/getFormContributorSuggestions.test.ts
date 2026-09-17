import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const EDITOR_ID = 2;
const VIEWER_ID = 3;

const findUniqueMarkerForm = vi.fn();
const findManyMarkerFormCollaborator = vi.fn();
const findManyUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormCollaborator: { findMany: (...args: unknown[]) => findManyMarkerFormCollaborator(...args) },
    user: { findMany: (...args: unknown[]) => findManyUser(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: VIEWER_ID, session: {} })),
}));

import { getFormContributorSuggestions } from "./getFormContributorSuggestions";

describe("getFormContributorSuggestions", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findManyMarkerFormCollaborator.mockReset();
    findManyUser.mockReset();

    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: OWNER_ID,
      archived: false,
      collaborators: [{ role: "VIEWER" }],
      versions: [{ id: 10, status: "DRAFT" }],
    });
  });

  it("includes the owner and every accepted collaborator", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([{ userId: EDITOR_ID }, { userId: VIEWER_ID }]);
    findManyUser.mockResolvedValue([
      { id: OWNER_ID, firstName: "Jane", lastName: "Owner", orcid: "0000-0001-0001-0001", institution: "Acme U" },
      { id: EDITOR_ID, firstName: "Ed", lastName: "Itor", orcid: null, institution: null },
      { id: VIEWER_ID, firstName: "Vi", lastName: "Ewer", orcid: null, institution: null },
    ]);

    const result = await getFormContributorSuggestions({ formId: FORM_ID });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(3);
      expect(result.data.find((s) => s.userId === OWNER_ID)).toEqual({
        userId: OWNER_ID,
        name: "Jane Owner",
        givenName: "Jane",
        familyName: "Owner",
        orcid: "0000-0001-0001-0001",
        affiliations: [{ name: "Acme U" }],
      });
    }

    expect(findManyUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [OWNER_ID, EDITOR_ID, VIEWER_ID] } } })
    );
  });

  it("filters out a user with no name on file rather than suggesting a blank entry", async () => {
    findManyMarkerFormCollaborator.mockResolvedValue([]);
    findManyUser.mockResolvedValue([{ id: OWNER_ID, firstName: null, lastName: null, orcid: null, institution: null }]);

    const result = await getFormContributorSuggestions({ formId: FORM_ID });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("rejects a user with no relationship to the form", async () => {
    findUniqueMarkerForm.mockResolvedValue({
      id: FORM_ID,
      ownerId: 999,
      archived: false,
      collaborators: [],
      versions: [{ id: 10, status: "DRAFT" }],
    });

    const result = await getFormContributorSuggestions({ formId: FORM_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });
});
