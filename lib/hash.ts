import argon2 from "argon2";

export const SecurePassword = {
  async hash(password: string): Promise<string> {
    // Match the secure-password defaults (Argon2id, m=65536, t=2, p=1)
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 2,
      parallelism: 1,
    });
  },
  
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
};
