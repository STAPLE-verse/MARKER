import { describe, expect, it } from "vitest";
import { publishFormSchema, publishFormSchemaForFamily, saveFormVersionSchema, strictPublicationContributorSchema } from "./schemas";

describe("saveFormVersionSchema", () => {
  const validInput = {
    formVersionId: 1,
    expectedUpdatedAt: new Date().toISOString(),
    formId: 1,
    schema: { type: "object", properties: {} },
    uiSchema: { "ui:order": ["*"] },
  };

  it("parses a valid input", () => {
    const result = saveFormVersionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("allows uiSchema to be omitted", () => {
    const { uiSchema: _uiSchema, ...rest } = validInput;
    const result = saveFormVersionSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects a non-ISO expectedUpdatedAt", () => {
    const result = saveFormVersionSchema.safeParse({
      ...validInput,
      expectedUpdatedAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing schema", () => {
    const { schema: _schema, ...rest } = validInput;
    const result = saveFormVersionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("publishFormSchema description", () => {
  const validInput = {
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    keywords: ["memory"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    version: "1.0.0",
    description: "A catalog-facing description for other researchers.",
  };

  it("accepts a non-empty description", () => {
    const result = publishFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects an empty description with a friendly message", () => {
    const result = publishFormSchema.safeParse({ ...validInput, description: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toContain("A description is required");
    }
  });

  it("rejects a missing description", () => {
    const { description: _description, ...rest } = validInput;
    const result = publishFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("publishFormSchema version", () => {
  const validInput = {
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    keywords: ["memory"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    description: "A catalog-facing description for other researchers.",
  };

  it("accepts versions with no leading zeros", () => {
    for (const version of ["0.1.0", "1.0.0", "10.20.30"]) {
      expect(publishFormSchema.safeParse({ ...validInput, version }).success).toBe(true);
    }
  });

  it("rejects versions with a leading zero in any part — matches Core V1's exact pattern", () => {
    for (const version of ["01.2.3", "1.02.0", "1.2.030"]) {
      expect(publishFormSchema.safeParse({ ...validInput, version }).success).toBe(false);
    }
  });
});

describe("publishFormSchemaForFamily", () => {
  const validInput = {
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    keywords: ["memory"],
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    description: "A catalog-facing description for other researchers.",
    version: "1.0.0",
  };

  it("accepts a version that hasn't been published for this family yet", () => {
    const schema = publishFormSchemaForFamily(["0.9.0"]);
    expect(schema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a version already published for this family, with a friendly message", () => {
    const schema = publishFormSchemaForFamily(["1.0.0"]);
    const result = schema.safeParse(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.version).toContain(
        "This version has already been published. Please choose a higher version number."
      );
    }
  });

  it("accepts any version when no versions have been published yet", () => {
    const schema = publishFormSchemaForFamily([]);
    expect(schema.safeParse(validInput).success).toBe(true);
  });

  it("still enforces the underlying version format, not just uniqueness", () => {
    const schema = publishFormSchemaForFamily([]);
    const result = schema.safeParse({ ...validInput, version: "01.2.3" });
    expect(result.success).toBe(false);
  });
});

describe("strictPublicationContributorSchema orcid", () => {
  const validInput = { name: "Jane Doe", roles: ["Author"] };

  it("accepts a well-formed ORCID", () => {
    expect(
      strictPublicationContributorSchema.safeParse({ ...validInput, orcid: "0000-0002-1825-0097" }).success
    ).toBe(true);
  });

  it("accepts an ORCID ending in the X checksum character", () => {
    expect(
      strictPublicationContributorSchema.safeParse({ ...validInput, orcid: "0000-0002-1825-009X" }).success
    ).toBe(true);
  });

  it("accepts an empty or omitted ORCID — the field is optional", () => {
    expect(strictPublicationContributorSchema.safeParse({ ...validInput, orcid: "" }).success).toBe(true);
    expect(strictPublicationContributorSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a malformed ORCID with a friendly message", () => {
    const result = strictPublicationContributorSchema.safeParse({ ...validInput, orcid: "not-an-orcid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.orcid).toContain("Must be a valid ORCID (e.g. 0000-0002-1825-0097)");
    }
  });
});

describe("publishFormSchema keywords", () => {
  const validInput = {
    domain: "Psychology",
    language: "en",
    license: "CC-BY-4.0",
    contributors: [{ name: "Jane Doe", roles: ["Author"] }],
    version: "1.0.0",
    description: "A catalog-facing description for other researchers.",
  };

  it("accepts unique keywords", () => {
    expect(publishFormSchema.safeParse({ ...validInput, keywords: ["memory", "cognition"] }).success).toBe(true);
  });

  it("rejects a duplicate keyword with a friendly message", () => {
    const result = publishFormSchema.safeParse({ ...validInput, keywords: ["memory", "memory"] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.keywords).toContain("Keywords must be unique");
    }
  });
});
