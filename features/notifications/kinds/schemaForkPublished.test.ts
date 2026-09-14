import { describe, expect, it } from "vitest";
import { renderSchemaForkPublished } from "./schemaForkPublished";

describe("renderSchemaForkPublished", () => {
  it("builds a message naming the publisher, the forked title, and the version", () => {
    const { message } = renderSchemaForkPublished({
      publisherUsername: "jane_doe",
      forkedTitle: "Copy of Cognitive Assessment Template",
      version: "1.0.0",
      forkedPid: "ps_fork123",
    });

    expect(message).toBe(
      'jane_doe published "Copy of Cognitive Assessment Template" v1.0.0, forked from your schema.'
    );
  });

  it("routes to the newly published fork's public catalog page", () => {
    const { routeData } = renderSchemaForkPublished({
      publisherUsername: "jane_doe",
      forkedTitle: "Schema",
      version: "1.0.0",
      forkedPid: "ps_fork123",
    });

    expect(routeData).toEqual({ path: "/schemas/ps_fork123" });
  });
});
