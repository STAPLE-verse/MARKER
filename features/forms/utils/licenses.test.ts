import { describe, expect, it } from "vitest";
import { licenseUriFor } from "./licenses";
import { PUBLICATION_LICENSE_OPTIONS } from "../constants/publicationMetadataOptions";

describe("licenseUriFor", () => {
  it("resolves each known SPDX-style license identifier", () => {
    expect(licenseUriFor("CC-BY-4.0")).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(licenseUriFor("CC0-1.0")).toBe("https://creativecommons.org/publicdomain/zero/1.0/");
    expect(licenseUriFor("MIT")).toBe("https://opensource.org/license/mit/");
  });

  it("has a URI for every license offered on the publish form", () => {
    for (const option of PUBLICATION_LICENSE_OPTIONS) {
      expect(licenseUriFor(option.value), option.value).toMatch(/^https:\/\//);
    }
  });

  it("returns undefined for an unknown license", () => {
    expect(licenseUriFor("Not-A-License")).toBeUndefined();
  });

  it("trims surrounding whitespace before lookup", () => {
    expect(licenseUriFor(" MIT ")).toBe("https://opensource.org/license/mit/");
  });
});
