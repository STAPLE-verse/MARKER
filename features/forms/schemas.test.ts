import { describe, expect, it } from "vitest";
import { publishFormSchema, saveFormVersionSchema } from "./schemas";

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
