import { describe, expect, it } from "vitest";
import { renderFormCollaboratorInvited } from "./formCollaboratorInvited";

describe("renderFormCollaboratorInvited", () => {
  it("names the inviter, form, and role", () => {
    const { message } = renderFormCollaboratorInvited({
      inviterUsername: "jane_doe",
      formTitle: "Cognitive Assessment",
      role: "EDITOR",
    });

    expect(message).toBe('jane_doe invited you to collaborate on "Cognitive Assessment" as an editor.');
  });

  it("labels a VIEWER invite distinctly from an EDITOR one", () => {
    const { message } = renderFormCollaboratorInvited({
      inviterUsername: "jane_doe",
      formTitle: "Cognitive Assessment",
      role: "VIEWER",
    });

    expect(message).toContain("as a viewer");
  });

  it("routes to the dashboard, not a dedicated invite page", () => {
    const { routeData } = renderFormCollaboratorInvited({
      inviterUsername: "jane_doe",
      formTitle: "Schema",
      role: "EDITOR",
    });

    expect(routeData).toEqual({ path: "/dashboard" });
  });
});
