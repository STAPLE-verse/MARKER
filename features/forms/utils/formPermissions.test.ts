import { describe, expect, it } from "vitest";
import { canEditForm } from "./formPermissions";

describe("canEditForm", () => {
  it("allows OWNER", () => {
    expect(canEditForm({ role: "OWNER", isPendingInvite: false })).toBe(true);
  });

  it("allows EDITOR", () => {
    expect(canEditForm({ role: "EDITOR", isPendingInvite: false })).toBe(true);
  });

  it("denies VIEWER", () => {
    expect(canEditForm({ role: "VIEWER", isPendingInvite: false })).toBe(false);
  });

  it("denies a still-pending EDITOR invite, even though role alone would read as granted", () => {
    expect(canEditForm({ role: "EDITOR", isPendingInvite: true })).toBe(false);
  });

  it("denies a still-pending VIEWER invite", () => {
    expect(canEditForm({ role: "VIEWER", isPendingInvite: true })).toBe(false);
  });
});
