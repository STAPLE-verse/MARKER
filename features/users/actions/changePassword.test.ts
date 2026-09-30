import { describe, expect, it, vi, beforeEach } from "vitest";

const USER_ID = 1;

const findUniqueUser = vi.fn();
const updateUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueUser(...args),
      update: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

vi.mock("@/utils/auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: USER_ID, session: {} })),
}));

const hash = vi.fn(async (password: string) => `hashed:${password}`);
const verify = vi.fn();

vi.mock("@/lib/hash", () => ({
  SecurePassword: {
    hash: (...args: [string]) => hash(...args),
    verify: (...args: [string, string]) => verify(...args),
  },
  PasswordVerifyResult: {
    VALID: "VALID",
    VALID_NEEDS_REHASH: "VALID_NEEDS_REHASH",
    INVALID: "INVALID",
  },
}));

const sendEmail = vi.fn();

vi.mock("@/lib/mailer", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { changePassword } from "./changePassword";

describe("changePassword", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    updateUser.mockReset();
    hash.mockClear();
    verify.mockReset();

    sendEmail.mockReset();

    findUniqueUser.mockResolvedValue({ hashedPassword: "current-hash", email: "ada@example.com" });
    updateUser.mockResolvedValue({});
    sendEmail.mockResolvedValue({ success: true });
  });

  it("emails a password-change notice once the new password is saved", async () => {
    verify.mockResolvedValue("VALID");

    await changePassword({
      currentPassword: "correct-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com", subject: "MARKER Password Change" })
    );
  });

  it("sends no notice when the current password is wrong", async () => {
    verify.mockResolvedValue("INVALID");

    await changePassword({
      currentPassword: "wrong-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects when the current password does not verify", async () => {
    verify.mockResolvedValue("INVALID");

    const res = await changePassword({
      currentPassword: "wrong-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("Current password is incorrect.");
    }
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("writes a fresh hash of the new password once the current one verifies", async () => {
    verify.mockResolvedValue("VALID");

    const res = await changePassword({
      currentPassword: "correct-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(res.ok).toBe(true);
    expect(hash).toHaveBeenCalledWith("new-password-123");
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { hashedPassword: "hashed:new-password-123" },
    });
  });

  it("also accepts a current password that needs rehashing", async () => {
    verify.mockResolvedValue("VALID_NEEDS_REHASH");

    const res = await changePassword({
      currentPassword: "correct-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(res.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it("returns a validation error when the confirmation does not match", async () => {
    const res = await changePassword({
      currentPassword: "correct-password",
      newPassword: "new-password-123",
      confirmPassword: "does-not-match",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION");
      expect(res.fieldErrors?.confirmPassword).toBeTruthy();
    }
    expect(verify).not.toHaveBeenCalled();
  });
});
