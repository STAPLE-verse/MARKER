import { describe, expect, it } from "vitest";
import { STAPLE_URL, stapleSignupUrl } from "./staple";

describe("stapleSignupUrl", () => {
  it("points at STAPLE's sign-up page, flagged as coming from MARKER", () => {
    expect(stapleSignupUrl()).toBe(`${STAPLE_URL}/auth/signup?from=marker`);
  });

  it("carries the post-login path through, URL-encoded", () => {
    expect(stapleSignupUrl("/schemas/ps_abc?version=2")).toBe(
      `${STAPLE_URL}/auth/signup?from=marker&next=%2Fschemas%2Fps_abc%3Fversion%3D2`
    );
  });

  it("omits next when there is none", () => {
    expect(stapleSignupUrl(null)).not.toContain("next=");
  });
});
