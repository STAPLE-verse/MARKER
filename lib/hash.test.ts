import { describe, expect, it } from "vitest"
import { PasswordVerifyResult, SecurePassword } from "./hash"

describe("SecurePassword", () => {
  it("round-trips a freshly hashed password as VALID", async () => {
    const hash = await SecurePassword.hash("correct horse battery staple")
    const result = await SecurePassword.verify("correct horse battery staple", hash)
    expect(result).toBe(PasswordVerifyResult.VALID)
  })

  it("rejects a wrong password against a fresh hash", async () => {
    const hash = await SecurePassword.hash("correct horse battery staple")
    const result = await SecurePassword.verify("wrong password", hash)
    expect(result).toBe(PasswordVerifyResult.INVALID)
  })

  it("stores the hash base64-encoded, not a bare PHC string", async () => {
    const hash = await SecurePassword.hash("correct horse battery staple")
    expect(hash.startsWith("$argon2")).toBe(false)
    expect(() => Buffer.from(hash, "base64")).not.toThrow()
  })

  it("rejects garbage/malformed hash input instead of throwing", async () => {
    const result = await SecurePassword.verify("any password", "not-a-real-hash")
    expect(result).toBe(PasswordVerifyResult.INVALID)
  })
})
