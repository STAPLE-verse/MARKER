import { describe, expect, it } from "vitest";
import { renderFormCollaboratorRemoved } from "./formCollaboratorRemoved";

describe("renderFormCollaboratorRemoved", () => {
  it("confirms a self-initiated leave without naming an actor", () => {
    const { message } = renderFormCollaboratorRemoved({
      formTitle: "Cognitive Assessment",
      initiatedBySelf: true,
      actorUsername: "jane_doe",
    });

    expect(message).toBe('You left "Cognitive Assessment".');
  });

  it("names who removed the collaborator when it wasn't self-initiated", () => {
    const { message } = renderFormCollaboratorRemoved({
      formTitle: "Cognitive Assessment",
      initiatedBySelf: false,
      actorUsername: "jane_doe",
    });

    expect(message).toBe('jane_doe removed you from "Cognitive Assessment".');
  });

  it("routes to the collection page either way", () => {
    const { routeData } = renderFormCollaboratorRemoved({
      formTitle: "Schema",
      initiatedBySelf: true,
      actorUsername: "jane_doe",
    });

    expect(routeData).toEqual({ path: "/collection" });
  });
});
