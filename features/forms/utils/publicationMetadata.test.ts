import { describe, expect, it } from "vitest";
import {
  mapContributors,
  normalizeKeywords,
  normalizePublicationMetadata,
} from "./publicationMetadata";

describe("normalizeKeywords", () => {
  it("trims whitespace and drops empty entries", () => {
    expect(normalizeKeywords([" neuroscience ", "", "   ", "fmri"])).toEqual([
      "neuroscience",
      "fmri",
    ]);
  });

  it("dedupes case-insensitively while preserving first-seen casing", () => {
    expect(normalizeKeywords(["fMRI", "FMRI", "fmri"])).toEqual(["fMRI"]);
  });

  it("drops non-string entries", () => {
    expect(normalizeKeywords(["a", 1, null, undefined, {}, "b"])).toEqual(["a", "b"]);
  });

  it("returns an empty array for non-array input", () => {
    expect(normalizeKeywords(undefined)).toEqual([]);
    expect(normalizeKeywords(null)).toEqual([]);
    expect(normalizeKeywords("not-an-array")).toEqual([]);
  });
});

describe("mapContributors", () => {
  it("trims contributor fields and normalizes a blank orcid to null", () => {
    expect(mapContributors([{ name: " Jane Doe ", role: " Creator ", orcid: "  " }])).toEqual([
      { name: "Jane Doe", role: "Creator", orcid: null },
    ]);
  });

  it("keeps a non-empty orcid trimmed", () => {
    expect(
      mapContributors([{ name: "Jane Doe", role: "Creator", orcid: " 0000-0000-0000-0000 " }])
    ).toEqual([{ name: "Jane Doe", role: "Creator", orcid: "0000-0000-0000-0000" }]);
  });

  it("drops entries that are entirely empty after trimming", () => {
    expect(mapContributors([{ name: "  ", role: "  ", orcid: "  " }])).toEqual([]);
  });

  it("drops non-object entries and returns an empty array for non-array input", () => {
    expect(mapContributors(["not-an-object", null, 42])).toEqual([]);
    expect(mapContributors(undefined)).toEqual([]);
  });
});

describe("normalizePublicationMetadata", () => {
  it("normalizes a full input", () => {
    expect(
      normalizePublicationMetadata({
        domain: " Neuroscience ",
        language: " en ",
        license: " CC-BY-4.0 ",
        keywords: [" fmri ", "fmri"],
        contributors: [{ name: "Jane Doe", role: "Creator", orcid: "" }],
      })
    ).toEqual({
      domain: "Neuroscience",
      language: "en",
      license: "CC-BY-4.0",
      keywords: ["fmri"],
      contributors: [{ name: "Jane Doe", role: "Creator", orcid: null }],
    });
  });

  it("normalizes blank strings to null and missing arrays to empty arrays", () => {
    expect(normalizePublicationMetadata({ domain: "   " })).toEqual({
      domain: null,
      language: null,
      license: null,
      keywords: [],
      contributors: [],
    });
  });

  it("handles null/undefined input", () => {
    expect(normalizePublicationMetadata(null)).toEqual({
      domain: null,
      language: null,
      license: null,
      keywords: [],
      contributors: [],
    });
    expect(normalizePublicationMetadata(undefined)).toEqual({
      domain: null,
      language: null,
      license: null,
      keywords: [],
      contributors: [],
    });
  });
});
