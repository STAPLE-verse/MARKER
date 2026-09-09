import SecurePasswordLib from "secure-password";

// Same package, same pinned version, and the same hash()/verify() call
// shape STAPLE's Blitz auth uses (@blitzjs/auth/secure-password, which
// wraps this exact library) — MARKER and STAPLE share one `User` table, and
// the signup page promises a STAPLE account works here without re-signing
// up, so a password hash written by either app must verify in both. Do not
// swap this for a different library/encoding without updating both apps.
const securePassword = new SecurePasswordLib();

export const PasswordVerifyResult = {
  VALID: "VALID",
  // secure-password's own params (memlimit/opslimit) were upgraded since
  // this hash was written — verified, but should be replaced with a fresh
  // one on this successful login.
  VALID_NEEDS_REHASH: "VALID_NEEDS_REHASH",
  INVALID: "INVALID",
} as const;
export type PasswordVerifyResult = (typeof PasswordVerifyResult)[keyof typeof PasswordVerifyResult];

export const SecurePassword = {
  /**
   * Hashes a new password using secure-password's scheme (libsodium
   * Argon2id, base64-encoded) — the same format STAPLE writes, so the
   * account works on both apps immediately.
   */
  async hash(password: string): Promise<string> {
    const hashedBuffer = await securePassword.hash(Buffer.from(password));
    return hashedBuffer.toString("base64");
  },

  /**
   * Verifies a password against its stored secure-password hash. Callers
   * should rehash and persist the new value whenever this returns
   * VALID_NEEDS_REHASH — see auth.ts's authorize(), which mirrors STAPLE's
   * own login.ts pattern.
   */
  async verify(password: string, hash: string): Promise<PasswordVerifyResult> {
    try {
      const result = await securePassword.verify(Buffer.from(password), Buffer.from(hash, "base64"));
      switch (result) {
        case SecurePasswordLib.VALID:
          return PasswordVerifyResult.VALID;
        case SecurePasswordLib.VALID_NEEDS_REHASH:
          return PasswordVerifyResult.VALID_NEEDS_REHASH;
        default:
          return PasswordVerifyResult.INVALID;
      }
    } catch {
      return PasswordVerifyResult.INVALID;
    }
  },
};
