import { describe, expect, it } from "vitest";
import { licenseUriFor } from "./licenses";

describe("licenseUriFor", () => {
  it("resolves each known SPDX-style license identifier", () => {
    expect(licenseUriFor("CC-BY-4.0")).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(licenseUriFor("CC0-1.0")).toBe("https://creativecommons.org/publicdomain/zero/1.0/");
    expect(licenseUriFor("MIT")).toBe("https://opensource.org/license/mit/");
  });

  it("returns undefined for an unknown license", () => {
    expect(licenseUriFor("GPL-3.0")).toBeUndefined();
  });

  it("trims surrounding whitespace before lookup", () => {
    expect(licenseUriFor(" MIT ")).toBe("https://opensource.org/license/mit/");
  });
});
