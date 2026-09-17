import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const COLLABORATOR_ID = 2;
const OUTSIDER_ID = 3;

const findUniqueMarkerForm = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
  },
}));

import { getViewerFormAccess } from "./getViewerFormAccess";

describe("getViewerFormAccess", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
  });

  it("returns null when the form doesn't exist", async () => {
    findUniqueMarkerForm.mockResolvedValue(null);

    expect(await getViewerFormAccess(FORM_ID, OWNER_ID)).toBeNull();
  });

  it("resolves OWNER for the form's owner", async () => {
    findUniqueMarkerForm.mockResolvedValue({ ownerId: OWNER_ID, collaborators: [] });

    expect(await getViewerFormAccess(FORM_ID, OWNER_ID)).toBe("OWNER");
  });

  it("resolves an accepted collaborator's own role", async () => {
    findUniqueMarkerForm.mockResolvedValue({ ownerId: OWNER_ID, collaborators: [{ role: "EDITOR" }] });

    expect(await getViewerFormAccess(FORM_ID, COLLABORATOR_ID)).toBe("EDITOR");
  });

  it("returns null for someone with neither ownership nor an accepted collaborator row", async () => {
    findUniqueMarkerForm.mockResolvedValue({ ownerId: OWNER_ID, collaborators: [] });

    expect(await getViewerFormAccess(FORM_ID, OUTSIDER_ID)).toBeNull();

    // The pending/accepted split is the query's job (acceptedAt filter in
    // the `where`), not this function's — confirm it's asking for exactly
    // that, since a caller passing an unfiltered row would silently grant a
    // pending invitee "access" this function was never meant to report.
    expect(findUniqueMarkerForm).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          collaborators: { where: { userId: OUTSIDER_ID, acceptedAt: { not: null } }, select: { role: true } },
        }),
      })
    );
  });
});
