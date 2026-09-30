import { describe, expect, it } from "vitest";
import { createCollaboratorInviteMsg, createEditPasswordMsg, createEditProfileMsg } from "./emails";

describe("email templates", () => {
  it("sends from the MARKER address with replies going to the help desk", () => {
    for (const msg of [
      createEditPasswordMsg({ to: "ada@example.com" }),
      createEditProfileMsg({ to: ["ada@example.com"] }),
      createCollaboratorInviteMsg({
        to: "ada@example.com",
        inviterUsername: "jane",
        formId: 7,
        formTitle: "Schema",
        role: "EDITOR",
      }),
    ]) {
      expect(msg.from).toBe("MARKER <app@staplescience.com>");
      expect(msg.replyTo).toBe("STAPLE Help <staple.helpdesk@gmail.com>");
    }
  });

  it("describes the invited role in plain words", () => {
    const viewer = createCollaboratorInviteMsg({
      to: "ada@example.com",
      inviterUsername: "jane",
      formId: 7,
      formTitle: "Schema",
      role: "VIEWER",
    });

    expect(viewer.html).toContain("a viewer, who can see the schema but not change it");
  });

  it("escapes user-written text so a schema title can't inject markup", () => {
    const msg = createCollaboratorInviteMsg({
      to: "ada@example.com",
      inviterUsername: "jane",
      formId: 7,
      formTitle: '<img src=x onerror="alert(1)">',
      role: "EDITOR",
    });

    expect(msg.html).not.toContain("<img src=x");
    expect(msg.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
