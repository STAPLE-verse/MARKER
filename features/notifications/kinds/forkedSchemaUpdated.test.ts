import { describe, expect, it } from "vitest";
import { renderForkedSchemaUpdated } from "./forkedSchemaUpdated";

describe("renderForkedSchemaUpdated", () => {
  it("builds a message naming the publisher, the title, and the new version", () => {
    const { message } = renderForkedSchemaUpdated({
      publisherUsername: "jane_doe",
      originalTitle: "Cognitive Assessment Template",
      version: "1.1.0",
      originalPid: "ps_v2",
    });

    expect(message).toBe(
      'jane_doe published a new version of "Cognitive Assessment Template" (v1.1.0), which you forked from.'
    );
  });

  it("routes to the newly published version's public catalog page", () => {
    const { routeData } = renderForkedSchemaUpdated({
      publisherUsername: "jane_doe",
      originalTitle: "Schema",
      version: "1.1.0",
      originalPid: "ps_v2",
    });

    expect(routeData).toEqual({ path: "/schemas/ps_v2" });
  });
});
