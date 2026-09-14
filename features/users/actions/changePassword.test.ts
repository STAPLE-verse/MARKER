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

import { changePassword } from "./changePassword";

describe("changePassword", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    updateUser.mockReset();
    hash.mockClear();
    verify.mockReset();

    findUniqueUser.mockResolvedValue({ hashedPassword: "current-hash" });
    updateUser.mockResolvedValue({});
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
