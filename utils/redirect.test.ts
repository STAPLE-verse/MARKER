import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./redirect";

describe("sanitizeNextPath", () => {
  it("allows a plain same-origin path", () => {
    expect(sanitizeNextPath("/schemas/ps_abc123")).toBe("/schemas/ps_abc123");
  });

  it("rejects an absolute URL", () => {
    expect(sanitizeNextPath("https://evil.example")).toBeNull();
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeNextPath("//evil.example")).toBeNull();
  });

  it("rejects a leading-backslash variant, which browsers resolve identically to a protocol-relative URL", () => {
    expect(sanitizeNextPath("/\\evil.example")).toBeNull();
  });

  it("rejects a value with no leading slash", () => {
    expect(sanitizeNextPath("dashboard")).toBeNull();
  });

  it("returns null for undefined/null/empty input", () => {
    expect(sanitizeNextPath(undefined)).toBeNull();
    expect(sanitizeNextPath(null)).toBeNull();
    expect(sanitizeNextPath("")).toBeNull();
  });

  it("takes the first value when given an array (repeated query param)", () => {
    expect(sanitizeNextPath(["/a", "/b"])).toBe("/a");
  });
});
