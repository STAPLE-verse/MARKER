import { describe, expect, it } from "vitest";
import { CORE_PROFILE_URI, SEMANTIC_PROFILE_URI } from "@staple-verse/marker-template-runtime";
import type { ContributorDTO } from "../types";
import {
  assembleDraftPackage,
  assemblePublishedPackage,
  formatDiagnosticsForUser,
  MARKER_PUBLISHER,
  validateTemplatePackage,
} from "./templatePackage";

const MINIMAL_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: { title: { type: "string" } },
};

const CREATOR: ContributorDTO = {
  name: "Jane Doe",
  nameType: "Personal",
  givenName: "Jane",
  familyName: "Doe",
  roles: ["Author", "Creator"],
  orcid: "0000-0002-1825-0097",
  affiliations: [{ name: "Acme University" }],
};

describe("assembleDraftPackage", () => {
  it("validates clean via validateCoreV1 for a minimal draft", () => {
    const pkg = assembleDraftPackage({
      familyId: "mf_1234567890",
      versionId: "mv_1234567890",
      version: "1",
      title: "Minimal draft",
      schema: MINIMAL_SCHEMA,
      uiSchema: {},
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    expect(pkg.metadata.status).toBe("draft");
    expect(pkg.metadata.familyId).toBe("urn:marker:family:mf_1234567890");
    expect(pkg.conformsTo).toEqual([CORE_PROFILE_URI]);
    expect(validateTemplatePackage(pkg)).toEqual([]);
  });

  it("defaults form.schema.$schema to the draft-07 dialect when the stored schema omits it", () => {
    const pkg = assembleDraftPackage({
      familyId: "mf_1",
      versionId: "mv_1",
      version: "1",
      title: "No $schema in storage",
      // Matches what createForm.ts and form-studio's FormBuilder actually produce today.
      schema: { type: "object", properties: {} },
      uiSchema: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(pkg.form.schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(validateTemplatePackage(pkg)).toEqual([]);
  });

  it("preserves an explicit, differing $schema instead of silently overriding it", () => {
    const pkg = assembleDraftPackage({
      familyId: "mf_1",
      versionId: "mv_1",
      version: "1",
      title: "Mismatched dialect",
      schema: { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties: {} },
      uiSchema: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(pkg.form.schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    // A genuine mismatch should still be caught, not silently normalized away.
    expect(validateTemplatePackage(pkg).some((d) => d.code === "FORM_SCHEMA_DIALECT")).toBe(true);
  });

  it("omits optional metadata fields entirely rather than writing empty/blank values", () => {
    const pkg = assembleDraftPackage({
      familyId: "mf_1",
      versionId: "mv_1",
      version: "1",
      title: "No optional fields",
      schema: MINIMAL_SCHEMA,
      uiSchema: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: null,
      domain: null,
      license: null,
      contributors: [],
    });

    expect(pkg.metadata).not.toHaveProperty("description");
    expect(pkg.metadata).not.toHaveProperty("domain");
    expect(pkg.metadata).not.toHaveProperty("license");
    expect(pkg.metadata).not.toHaveProperty("contributors");
    expect(pkg.form.uiSchema).toEqual({});
  });

  it("includes the Semantic V1 profile and payload exactly when semantics is present", () => {
    const withSemantics = assembleDraftPackage({
      familyId: "mf_1",
      versionId: "mv_1",
      version: "1",
      title: "Has semantics",
      schema: MINIMAL_SCHEMA,
      uiSchema: {},
      semantics: { bindings: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const withoutSemantics = assembleDraftPackage({
      familyId: "mf_1",
      versionId: "mv_1",
      version: "1",
      title: "No semantics",
      schema: MINIMAL_SCHEMA,
      uiSchema: {},
      semantics: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(withSemantics.conformsTo).toContain(SEMANTIC_PROFILE_URI);
    expect(withSemantics.semantics).toEqual({ bindings: [] });
    expect(withoutSemantics.conformsTo).not.toContain(SEMANTIC_PROFILE_URI);
    expect(withoutSemantics).not.toHaveProperty("semantics");
  });
});

describe("assemblePublishedPackage", () => {
  function buildInput(overrides: Partial<Parameters<typeof assemblePublishedPackage>[0]> = {}) {
    return {
      pid: "ps_abc1234567",
      familyId: "mf_1234567890",
      version: "1.0.0",
      title: "Published template",
      schema: MINIMAL_SCHEMA,
      uiSchema: {},
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-09-01T00:00:00.000Z"),
      publishedAt: new Date("2026-09-01T00:00:00.000Z"),
      description: "A published template.",
      language: "en",
      domain: "Psychology",
      keywords: ["memory", "cognition"],
      contributors: [CREATOR],
      license: "CC-BY-4.0",
      releaseNotes: "Initial release.",
      ...overrides,
    };
  }

  it("validates clean via validateCoreV1 with a full set of publication metadata", () => {
    const pkg = assemblePublishedPackage(buildInput());

    expect(pkg.metadata.status).toBe("published");
    expect((pkg.metadata as { publisher?: unknown }).publisher).toEqual(MARKER_PUBLISHER);
    expect((pkg.metadata as { license?: unknown }).license).toEqual({
      identifier: "CC-BY-4.0",
      uri: "https://creativecommons.org/licenses/by/4.0/",
    });
    expect(validateTemplatePackage(pkg)).toEqual([]);
  });

  it("derives versionId from the pid, not from the draft-phase versionId", () => {
    const pkg = assemblePublishedPackage(buildInput());
    expect(pkg.metadata.versionId).toBe("http://localhost:3000/schemas/ps_abc1234567");
  });

  it("validates clean with no Creator-role contributor — the rc.4 requirement drop", () => {
    const editorOnly: ContributorDTO = { ...CREATOR, roles: ["Editor"] };
    const pkg = assemblePublishedPackage(buildInput({ contributors: [editorOnly] }));

    expect(validateTemplatePackage(pkg)).toEqual([]);
  });

  it("reports diagnostics for an empty contributors array instead of throwing", () => {
    const pkg = assemblePublishedPackage(buildInput({ contributors: [] }));
    const diagnostics = validateTemplatePackage(pkg);

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("reports diagnostics for a non-semver version label", () => {
    const pkg = assemblePublishedPackage(buildInput({ version: "not-semver" }));
    const diagnostics = validateTemplatePackage(pkg);

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("maps a bare ORCID into the spec's {value, scheme} identifier shape", () => {
    const pkg = assemblePublishedPackage(buildInput());
    const contributors = (pkg.metadata as { contributors: ContributorDTO[] }).contributors as unknown as Array<{
      identifiers?: { value: string; scheme: string }[];
    }>;

    expect(contributors[0].identifiers).toEqual([{ value: "https://orcid.org/0000-0002-1825-0097", scheme: "ORCID" }]);
  });

  it("runs Semantic V1 validation only after Core V1 passes", () => {
    const invalidSemantics = assemblePublishedPackage(
      buildInput({ schema: { type: "object" }, semantics: { bindings: "not-an-array" } })
    );
    // Core V1 itself doesn't understand `semantics`' internal shape, but a
    // structurally broken package should still surface *some* diagnostic
    // rather than silently validating clean.
    const diagnostics = validateTemplatePackage(invalidSemantics);
    expect(diagnostics.length).toBeGreaterThan(0);
  });
});

describe("formatDiagnosticsForUser", () => {
  it("joins diagnostic messages for display", () => {
    const message = formatDiagnosticsForUser([
      { stage: "core", code: "REQUIRED", pointer: "/metadata/license", message: "license is required" },
      { stage: "core", code: "REQUIRED", pointer: "/metadata/publisher", message: "publisher is required" },
    ]);

    expect(message).toBe("license is required; publisher is required");
  });

  it("returns an empty string for no diagnostics", () => {
    expect(formatDiagnosticsForUser([])).toBe("");
  });
});
