import { describe, expect, it } from "vitest";
import { renderFormCollaboratorInvited } from "./formCollaboratorInvited";

describe("renderFormCollaboratorInvited", () => {
  it("names the inviter, form, and role", () => {
    const { message } = renderFormCollaboratorInvited({
      formId: 1,
      inviterUsername: "jane_doe",
      formTitle: "Cognitive Assessment",
      role: "EDITOR",
    });

    expect(message).toBe('jane_doe invited you to collaborate on "Cognitive Assessment" as an editor.');
  });

  it("labels a VIEWER invite distinctly from an EDITOR one", () => {
    const { message } = renderFormCollaboratorInvited({
      formId: 1,
      inviterUsername: "jane_doe",
      formTitle: "Cognitive Assessment",
      role: "VIEWER",
    });

    expect(message).toContain("as a viewer");
  });

  it("routes directly to the form, where the accept/decline banner lives", () => {
    const { routeData } = renderFormCollaboratorInvited({
      formId: 42,
      inviterUsername: "jane_doe",
      formTitle: "Schema",
      role: "EDITOR",
    });

    expect(routeData).toEqual({ path: "/collection/42" });
  });
});
