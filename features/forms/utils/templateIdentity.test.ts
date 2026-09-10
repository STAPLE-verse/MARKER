import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CORE_PROFILE_URI, SEMANTIC_PROFILE_URI } from "@staple-verse/marker-template-runtime";
import {
  conformsToFor,
  draftVersionIdFor,
  familyIdFor,
  publishedVersionIdFor,
} from "./templateIdentity";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("familyIdFor / draftVersionIdFor", () => {
  it("wraps the opaque stored value into a well-formed URI", () => {
    expect(familyIdFor("mf_8f9a2b1c0d")).toBe("urn:marker:family:mf_8f9a2b1c0d");
    expect(draftVersionIdFor("mv_8f9a2b1c0d")).toBe("urn:marker:draft-version:mv_8f9a2b1c0d");
  });

  it("is a pure, deterministic function of the input", () => {
    expect(familyIdFor("mf_x")).toBe(familyIdFor("mf_x"));
  });
});

describe("publishedVersionIdFor", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("falls back to the localhost placeholder when NEXT_PUBLIC_APP_URL is unset", () => {
    expect(publishedVersionIdFor("ps_abc123")).toBe("http://localhost:3000/schemas/ps_abc123");
  });

  it("uses NEXT_PUBLIC_APP_URL when set, stripping a trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://marker.example.org/";
    expect(publishedVersionIdFor("ps_abc123")).toBe("https://marker.example.org/schemas/ps_abc123");
  });
});

describe("conformsToFor", () => {
  it("includes only Core V1 when semantics is absent", () => {
    expect(conformsToFor(false)).toEqual([CORE_PROFILE_URI]);
  });

  it("includes both profiles when semantics is present", () => {
    expect(conformsToFor(true)).toEqual([CORE_PROFILE_URI, SEMANTIC_PROFILE_URI]);
  });
});
