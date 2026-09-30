import { describe, expect, it, vi, beforeEach } from "vitest";

const FORM_ID = 1;
const OWNER_ID = 1;
const OTHER_USER_ID = 2;
const INVITEE_ID = 3;

const findUniqueMarkerForm = vi.fn();
const findUniqueUser = vi.fn();
const findUniqueMarkerFormCollaborator = vi.fn();
const createMarkerFormCollaborator = vi.fn();
const createNotificationRow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    markerForm: { findUnique: (...args: unknown[]) => findUniqueMarkerForm(...args) },
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    markerFormCollaborator: {
      findUnique: (...args: unknown[]) => findUniqueMarkerFormCollaborator(...args),
      create: (...args: unknown[]) => createMarkerFormCollaborator(...args),
      findMany: vi.fn(async () => []),
    },
    notification: { create: (...args: unknown[]) => createNotificationRow(...args) },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: OWNER_ID, session: {} })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sendEmail = vi.fn();

vi.mock("@/lib/mailer", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { inviteCollaborator } from "./inviteCollaborator";

function mockOwnedForm(overrides: Record<string, unknown> = {}) {
  findUniqueMarkerForm.mockResolvedValue({
    id: FORM_ID,
    ownerId: OWNER_ID,
    archived: false,
    collaborators: [],
    versions: [{ id: 10, name: "Cognitive Assessment", status: "DRAFT" }],
    ...overrides,
  });
}

describe("inviteCollaborator", () => {
  beforeEach(() => {
    findUniqueMarkerForm.mockReset();
    findUniqueUser.mockReset();
    findUniqueMarkerFormCollaborator.mockReset();
    createMarkerFormCollaborator.mockReset();
    createNotificationRow.mockReset();

    mockOwnedForm();
    findUniqueMarkerFormCollaborator.mockResolvedValue(null);
    createMarkerFormCollaborator.mockResolvedValue({ id: 500, invitedAt: new Date("2026-09-01T00:00:00.000Z") });
    findUniqueUser.mockImplementation(async ({ where }: { where: { id: number } }) =>
      where.id === INVITEE_ID
        ? { id: INVITEE_ID, username: "new_collaborator", email: "new@example.com" }
        : { username: "jane_owner" }
    );
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ success: true });
  });

  it("emails the invitee with the inviter, schema title, and a link to the schema", async () => {
    await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const msg = sendEmail.mock.calls[0][0];
    expect(msg.to).toBe("new@example.com");
    expect(msg.subject).toBe("MARKER Schema Invitation");
    expect(msg.html).toContain("jane_owner");
    expect(msg.html).toContain("Cognitive Assessment");
    expect(msg.html).toContain(`/collection/${FORM_ID}`);
  });

  it("still creates the invite when the email can't be sent", async () => {
    sendEmail.mockResolvedValue({ success: false, error: "down" });

    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(result.ok).toBe(true);
  });

  it("sends no email when the invite is rejected", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ acceptedAt: null });

    await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("creates a pending collaborator row and notifies the invitee", async () => {
    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(result.ok).toBe(true);
    expect(createMarkerFormCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ formId: FORM_ID, userId: INVITEE_ID, role: "EDITOR", invitedById: OWNER_ID }),
      })
    );
    expect(createNotificationRow).toHaveBeenCalledTimes(1);
    if (result.ok) expect(result.data).toEqual({ success: true, collaboratorId: 500, invitedAt: "2026-09-01T00:00:00.000Z" });
  });

  it("rejects a non-owner (FORBIDDEN)", async () => {
    mockOwnedForm({ ownerId: OTHER_USER_ID });

    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
    expect(createMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("rejects inviting the form's own owner", async () => {
    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: OWNER_ID, role: "EDITOR" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONFLICT");
    expect(createMarkerFormCollaborator).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a nonexistent invitee", async () => {
    findUniqueUser.mockResolvedValueOnce(null);

    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: 999, role: "EDITOR" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });

  it("rejects re-inviting an already-accepted collaborator with a clear message", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ acceptedAt: new Date() });

    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.error).toMatch(/already a collaborator/);
    }
  });

  it("rejects re-inviting someone with a still-pending invite, worded differently", async () => {
    findUniqueMarkerFormCollaborator.mockResolvedValue({ acceptedAt: null });

    const result = await inviteCollaborator({ formId: FORM_ID, inviteeUserId: INVITEE_ID, role: "EDITOR" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.error).toMatch(/already been invited/);
    }
  });
});
