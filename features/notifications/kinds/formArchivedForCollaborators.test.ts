import { describe, expect, it } from "vitest";
import { renderFormArchivedForCollaborators } from "./formArchivedForCollaborators";

describe("renderFormArchivedForCollaborators", () => {
  it("names the form and explains the loss of access", () => {
    const { message } = renderFormArchivedForCollaborators({ formTitle: "Cognitive Assessment" });

    expect(message).toBe('"Cognitive Assessment" was archived by its owner. You no longer have access to it.');
  });

  it("routes to the collection page, not the now-inaccessible form", () => {
    const { routeData } = renderFormArchivedForCollaborators({ formTitle: "Schema" });

    expect(routeData).toEqual({ path: "/collection" });
  });
});
