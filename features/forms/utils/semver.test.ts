import { describe, expect, it } from "vitest";
import { suggestNextVersion } from "./semver";

describe("suggestNextVersion", () => {
  it("suggests 1.0.0 for a family with no published versions", () => {
    expect(suggestNextVersion([])).toBe("1.0.0");
  });

  it("bumps the patch of the current highest version", () => {
    expect(suggestNextVersion(["1.0.0"])).toBe("1.0.1");
    expect(suggestNextVersion(["1.0.0", "1.0.5"])).toBe("1.0.6");
  });

  it("compares by full semver order, not lexicographic string order", () => {
    // Lexicographically "1.9.0" > "1.10.0", but semver-wise it's the reverse.
    expect(suggestNextVersion(["1.9.0", "1.10.0"])).toBe("1.10.1");
    expect(suggestNextVersion(["2.0.0", "10.0.0"])).toBe("10.0.1");
  });

  it("ignores versions that don't match the current semver pattern", () => {
    expect(suggestNextVersion(["not-a-version", "1.2.3"])).toBe("1.2.4");
  });

  it("falls back to 1.0.0 when every entry is unparseable", () => {
    expect(suggestNextVersion(["not-a-version", "also bad"])).toBe("1.0.0");
  });

  it("doesn't depend on input order", () => {
    expect(suggestNextVersion(["1.0.0", "2.0.0", "1.5.0"])).toBe("2.0.1");
    expect(suggestNextVersion(["2.0.0", "1.5.0", "1.0.0"])).toBe("2.0.1");
  });
});
