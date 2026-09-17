import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const OTHER_USER_ID = 2;
const COLLABORATOR_ID = 50;

const findUniqueMarkerForm = vi.fn();
const findUniqueMarkerFormCollaborator = vi.fn();
const updateMarkerFormCollaborator = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      update: (...args: unknown[]) => updateMarkerFormCollaborator(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateCollaboratorRole } from "./updateCollaboratorRole";

function mockOwnedForm(overrides: Record<string, unknown> = {}) {
  findUniqueMarkerForm.mockResolvedValue({
    id: FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    collaborators: [],
    versions: [{ id: 10, status: "DRAFT" }],
    ...overrides,
  });
}

describe("updateCollaboratorRole", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findUniqueMarkerFormCollaborator.mockReset();
    updateMarkerFormCollaborator.mockReset();

    mockOwnedForm();
    findUniqueMarkerFormCollaborator.mockResolvedValue({ id: COLLABORATOR_ID, formId: FORM_ID });
  });

  it("lets the owner change a collaborator's role", async () => {
    const result = await updateCollaboratorRole({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID, role: "VIEWER" });

    expect(result.ok).toBe(true);
    expect(updateMarkerFormCollaborator).toHaveBeenCalledWith({
      where: { id: COLLABORATOR_ID },
      data: { role: "VIEWER" },
    });
  });

  it("works identically on a still-pending row (no separate code path)", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ id: COLLABORATOR_ID, formId: FORM_ID, acceptedAt: null });

    const result = await updateCollaboratorRole({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID, role: "EDITOR" });

    expect(result.ok).toBe(true);
  });

  it("rejects a non-owner", async () => {
    mockOwnedForm({ ownerId: OTHER_USER_ID });

    const result = await updateCollaboratorRole({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID, role: "VIEWER" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
    expect(updateMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("rejects a role update for a collaborator not on this form", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ id: COLLABORATOR_ID, formId: 999 });

    const result = await updateCollaboratorRole({ formId: FORM_ID, collaboratorId: COLLABORATOR_ID, role: "VIEWER" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

  it("rejects OWNER as a role value at the input-validation layer", async () => {
    // `authenticatedAction` takes `unknown` at the call boundary and Zod-validates
    // at runtime — OWNER is intentionally not part of the accepted role union.
    const result = await updateCollaboratorRole({
      formId: FORM_ID,
      collaboratorId: COLLABORATOR_ID,
      role: "OWNER",
    } as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VALIDATION");
  });
});
