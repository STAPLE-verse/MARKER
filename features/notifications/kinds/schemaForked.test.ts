import { describe, expect, it } from "vitest";
import { renderSchemaForked } from "./schemaForked";

describe("renderSchemaForked", () => {
  it("builds a message naming the forker and the original title", () => {
    const { message } = renderSchemaForked({
      forkedByUsername: "jane_doe",
      originalTitle: "Cognitive Assessment Template",
      originalFormId: 42,
      originalPid: "ps_abc123",
    });

    expect(message).toBe('jane_doe forked your schema "Cognitive Assessment Template".');
  });

  it("routes to the original author's own draft when the form still exists", () => {
    const { routeData } = renderSchemaForked({
      forkedByUsername: "jane_doe",
      originalTitle: "Schema",
      originalFormId: 42,
      originalPid: "ps_abc123",
    });

    expect(routeData).toEqual({ path: "/collection/42" });
  });

  it("falls back to the public catalog page when the origin draft is gone", () => {
    const { routeData } = renderSchemaForked({
      forkedByUsername: "jane_doe",
      originalTitle: "Schema",
      originalFormId: null,
      originalPid: "ps_abc123",
    });

    expect(routeData).toEqual({ path: "/schemas/ps_abc123" });
  });
});
