import { describe, expect, it } from "vitest";
import {
  assembleContributorName,
  availableContributorRoles,
  mapContributors,
  normalizeAffiliations,
  normalizeKeywords,
  normalizePublicationMetadata,
  normalizeRoles,
  sortRoles,
} from "./publicationMetadata";

const BASE_CONTRIBUTOR_FIELDS = {
  nameType: undefined,
  givenName: undefined,
  familyName: undefined,
  affiliations: [],
};

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

describe("normalizeRoles", () => {
  it("trims whitespace and drops empty entries", () => {
    expect(normalizeRoles([" Creator ", "", "   ", "Translator"])).toEqual([
      "Creator",
      "Translator",
    ]);
  });

  it("dedupes exact duplicates while staying case-sensitive", () => {
    expect(normalizeRoles(["Creator", "Creator", "creator"])).toEqual(["Creator", "creator"]);
  });

  it("drops non-string entries and returns an empty array for non-array input", () => {
    expect(normalizeRoles(["Creator", 1, null, undefined, {}])).toEqual(["Creator"]);
    expect(normalizeRoles(undefined)).toEqual([]);
    expect(normalizeRoles(null)).toEqual([]);
  });
});

describe("mapContributors", () => {
  it("trims contributor fields and normalizes a blank orcid to null", () => {
    expect(
      mapContributors([{ name: " Jane Doe ", roles: [" Creator ", "Translator"], orcid: "  " }])
    ).toEqual([{ ...BASE_CONTRIBUTOR_FIELDS, name: "Jane Doe", roles: ["Creator", "Translator"], orcid: null }]);
  });

  it("keeps a non-empty orcid trimmed", () => {
    expect(
      mapContributors([
        { name: "Jane Doe", roles: ["Creator"], orcid: " 0000-0000-0000-0000 " },
      ])
    ).toEqual([{ ...BASE_CONTRIBUTOR_FIELDS, name: "Jane Doe", roles: ["Creator"], orcid: "0000-0000-0000-0000" }]);
  });

  it("drops entries that are entirely empty after trimming", () => {
    expect(mapContributors([{ name: "  ", roles: [], orcid: "  " }])).toEqual([]);
  });

  it("keeps an entry with roles but no name or orcid", () => {
    expect(mapContributors([{ name: "  ", roles: ["Creator"], orcid: "  " }])).toEqual([
      { ...BASE_CONTRIBUTOR_FIELDS, name: "", roles: ["Creator"], orcid: null },
    ]);
  });

  it("drops non-object entries and returns an empty array for non-array input", () => {
    expect(mapContributors(["not-an-object", null, 42])).toEqual([]);
    expect(mapContributors(undefined)).toEqual([]);
  });

  it("normalizes nameType, keeping only the two recognized values", () => {
    const [personal] = mapContributors([{ name: "Jane Doe", roles: ["Creator"], nameType: "Personal" }]);
    const [organizational] = mapContributors([
      { name: "Acme Labs", roles: ["Creator"], nameType: "Organizational" },
    ]);
    const [invalid] = mapContributors([{ name: "Jane Doe", roles: ["Creator"], nameType: "Bogus" }]);

    expect(personal.nameType).toBe("Personal");
    expect(organizational.nameType).toBe("Organizational");
    expect(invalid.nameType).toBeUndefined();
  });

  it("trims givenName/familyName and drops them when blank", () => {
    const [contributor] = mapContributors([
      { name: "Jane Doe", roles: ["Creator"], givenName: " Jane ", familyName: "   " },
    ]);

    expect(contributor.givenName).toBe("Jane");
    expect(contributor.familyName).toBeUndefined();
  });

  it("normalizes affiliations", () => {
    const [contributor] = mapContributors([
      {
        name: "Jane Doe",
        roles: ["Creator"],
        affiliations: [{ name: " Acme University " }, { name: "" }],
      },
    ]);

    expect(contributor.affiliations).toEqual([{ name: "Acme University" }]);
  });
});

describe("assembleContributorName", () => {
  it("joins given and family name for a personal contributor", () => {
    expect(assembleContributorName({ nameType: "Personal", givenName: "Jane", familyName: "Doe" })).toBe(
      "Jane Doe"
    );
  });

  it("defaults to personal when nameType is absent", () => {
    expect(assembleContributorName({ givenName: "Jane", familyName: "Doe" })).toBe("Jane Doe");
  });

  it("uses only the given or family name when the other is missing", () => {
    expect(assembleContributorName({ nameType: "Personal", givenName: "Jane" })).toBe("Jane");
    expect(assembleContributorName({ nameType: "Personal", familyName: "Doe" })).toBe("Doe");
  });

  it("is empty for a personal contributor with no given or family name, ignoring any typed name", () => {
    expect(assembleContributorName({ nameType: "Personal", name: "Should Be Ignored" })).toBe("");
  });

  it("uses the typed name directly for an organizational contributor, ignoring given/family", () => {
    expect(
      assembleContributorName({
        nameType: "Organizational",
        name: "Acme Labs",
        givenName: "Jane",
        familyName: "Doe",
      })
    ).toBe("Acme Labs");
  });

  it("trims whitespace", () => {
    expect(assembleContributorName({ nameType: "Personal", givenName: " Jane ", familyName: " Doe " })).toBe(
      "Jane Doe"
    );
  });
});

describe("normalizeAffiliations", () => {
  it("trims names and drops blank or duplicate entries", () => {
    expect(
      normalizeAffiliations([{ name: " Acme University " }, { name: "Acme University" }, { name: "  " }])
    ).toEqual([{ name: "Acme University" }]);
  });

  it("returns an empty array for non-array input", () => {
    expect(normalizeAffiliations(undefined)).toEqual([]);
    expect(normalizeAffiliations(null)).toEqual([]);
    expect(normalizeAffiliations("not-an-array")).toEqual([]);
  });
});

describe("availableContributorRoles", () => {
  it("includes the fixed options even with no contributors", () => {
    const roles = availableContributorRoles([]);
    expect(roles).toContain("Author");
    expect(roles).toContain("Creator");
  });

  it("adds a custom role used by any contributor exactly once", () => {
    const roles = availableContributorRoles([
      { roles: ["Statistician"] },
      { roles: ["Statistician", "Author"] },
    ]);
    const occurrences = roles.filter((role) => role === "Statistician").length;
    expect(occurrences).toBe(1);
    expect(roles).toContain("Author");
  });

  it("includes extraRoles, deduped against the other sources", () => {
    const roles = availableContributorRoles([{ roles: ["Author"] }], ["Author", "Illustrator"]);
    expect(roles.filter((role) => role === "Author").length).toBe(1);
    expect(roles).toContain("Illustrator");
  });
});

describe("sortRoles", () => {
  it("sorts alphabetically without mutating the input", () => {
    const roles = ["Translator", "Author", "Creator"];
    expect(sortRoles(roles)).toEqual(["Author", "Creator", "Translator"]);
    expect(roles).toEqual(["Translator", "Author", "Creator"]);
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
        contributors: [{ name: "Jane Doe", roles: ["Creator"], orcid: "" }],
      })
    ).toEqual({
      domain: "Neuroscience",
      language: "en",
      license: "CC-BY-4.0",
      keywords: ["fmri"],
      contributors: [{ ...BASE_CONTRIBUTOR_FIELDS, name: "Jane Doe", roles: ["Creator"], orcid: null }],
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
