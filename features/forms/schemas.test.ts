import { describe, expect, it } from "vitest";
import { saveFormVersionSchema } from "./schemas";

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
