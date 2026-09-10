import {
  FORM_SCHEMA_DIALECT,
  validateCoreV1,
  validateSemanticV1,
} from "@staple-verse/marker-template-runtime"
import type {
  ConformanceDiagnostic,
  JsonObject,
  MarkerTemplatePackage,
  SemanticV1Component,
  TemplateContributor,
  TemplatePublisher,
} from "@staple-verse/marker-template-runtime"
import type { ContributorDTO } from "../types"
import { conformsToFor, draftVersionIdFor, familyIdFor, publishedVersionIdFor } from "./templateIdentity"
import { licenseUriFor } from "./licenses"

/**
 * Every published package's publisher of record. MARKER itself, not the
 * depositing author — matching how repositories like Zenodo list themselves
 * as publisher while real per-person credit lives in `contributors`. Never a
 * DB column, never user-editable (see linear-coalescing-crescent.md, Phase 5).
 */
export const MARKER_PUBLISHER: TemplatePublisher = { name: "MARKER" }

function toIso(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString()
}

/** Maps a bare ORCID (or an already-full ORCID URL) to marker-template-spec's `{value, scheme}` shape. */
function toOrcidUri(orcid: string): string {
  const trimmed = orcid.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://orcid.org/${trimmed}`
}

function toTemplateContributorFields(contributor: ContributorDTO) {
  return {
    name: contributor.name,
    ...(contributor.nameType ? { nameType: contributor.nameType } : {}),
    ...(contributor.givenName ? { givenName: contributor.givenName } : {}),
    ...(contributor.familyName ? { familyName: contributor.familyName } : {}),
    ...(contributor.orcid
      ? { identifiers: [{ value: toOrcidUri(contributor.orcid), scheme: "ORCID" }] }
      : {}),
    ...(contributor.affiliations?.length
      ? { affiliations: contributor.affiliations.map((affiliation) => ({ name: affiliation.name })) }
      : {}),
  }
}

/** Draft contributors: `roles` is optional on the wire (schema allows an absent `roles` key). */
function toTemplateContributor(contributor: ContributorDTO): TemplateContributor {
  return {
    ...toTemplateContributorFields(contributor),
    ...(contributor.roles.length ? { roles: contributor.roles } : {}),
  }
}

/** Published contributors: `roles` is required (non-empty, enforced upstream by `strictPublicationContributorSchema`). */
function toPublishedTemplateContributor(contributor: ContributorDTO): TemplateContributor & { roles: string[] } {
  return {
    ...toTemplateContributorFields(contributor),
    roles: contributor.roles,
  }
}

interface AssembleCommonInput {
  familyId: string
  title: string
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | null | undefined
  semantics?: unknown | null
  createdAt: Date | string
  updatedAt: Date | string
  description?: string | null
  language?: string | null
  domain?: string | null
  keywords?: string[]
  contributors?: ContributorDTO[]
  license?: string | null
  releaseNotes?: string | null
}

export interface AssembleDraftPackageInput extends AssembleCommonInput {
  versionId: string
  /** Human-facing version label; drafts don't need semver (e.g. the version number as a string). */
  version: string
}

export interface AssemblePublishedPackageInput extends AssembleCommonInput {
  pid: string
  /** Must be semver (`publishFormSchema` already enforces this at the input boundary). */
  version: string
  publishedAt: Date | string
  description: string
  language: string
  keywords: string[]
  contributors: ContributorDTO[]
  license: string
}

/**
 * Fills in the Core V1 `$schema` dialect declaration when the stored schema
 * doesn't already carry one — true for every schema MARKER's own editor
 * produces today (`createForm.ts`'s initial schema and form-studio's
 * `FormBuilder` output never set `$schema`). An explicit, differing value is
 * preserved rather than overridden, so a genuine dialect mismatch still
 * surfaces as a diagnostic instead of being silently papered over.
 */
function buildForm(schema: Record<string, unknown>, uiSchema: Record<string, unknown> | null | undefined) {
  return {
    schema: { $schema: FORM_SCHEMA_DIALECT, ...schema } as JsonObject,
    uiSchema: (uiSchema ?? {}) as JsonObject,
  }
}

function buildLicense(license: string) {
  const uri = licenseUriFor(license)
  return { identifier: license, ...(uri ? { uri } : {}) }
}

export function assembleDraftPackage(input: AssembleDraftPackageInput): MarkerTemplatePackage {
  const hasSemantics = input.semantics !== undefined && input.semantics !== null
  const contributors = (input.contributors ?? []).map(toTemplateContributor)

  return {
    conformsTo: conformsToFor(hasSemantics),
    metadata: {
      familyId: familyIdFor(input.familyId),
      versionId: draftVersionIdFor(input.versionId),
      version: input.version,
      status: "draft",
      resourceType: "MetadataTemplate",
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      ...(input.language ? { language: input.language } : {}),
      ...(contributors.length ? { contributors } : {}),
      ...(input.license ? { license: buildLicense(input.license) } : {}),
      ...(input.keywords ? { keywords: input.keywords } : {}),
      ...(input.domain ? { domain: input.domain } : {}),
      createdAt: toIso(input.createdAt),
      updatedAt: toIso(input.updatedAt),
      ...(input.releaseNotes ? { releaseNotes: input.releaseNotes } : {}),
    },
    form: buildForm(input.schema, input.uiSchema),
    ...(hasSemantics ? { semantics: input.semantics as SemanticV1Component } : {}),
  }
}

export function assemblePublishedPackage(input: AssemblePublishedPackageInput): MarkerTemplatePackage {
  const hasSemantics = input.semantics !== undefined && input.semantics !== null
  const contributors = input.contributors.map(toPublishedTemplateContributor)

  return {
    conformsTo: conformsToFor(hasSemantics),
    metadata: {
      familyId: familyIdFor(input.familyId),
      versionId: publishedVersionIdFor(input.pid),
      version: input.version,
      status: "published",
      resourceType: "MetadataTemplate",
      title: input.title,
      description: input.description,
      language: input.language,
      contributors,
      publisher: MARKER_PUBLISHER,
      license: buildLicense(input.license),
      keywords: input.keywords,
      ...(input.domain ? { domain: input.domain } : {}),
      createdAt: toIso(input.createdAt),
      updatedAt: toIso(input.updatedAt),
      publishedAt: toIso(input.publishedAt),
      ...(input.releaseNotes ? { releaseNotes: input.releaseNotes } : {}),
    },
    form: buildForm(input.schema, input.uiSchema),
    ...(hasSemantics ? { semantics: input.semantics as SemanticV1Component } : {}),
  }
}

/**
 * Runs the same two-stage gate the runtime is designed for: Core V1 first
 * (structure/identity/publication-metadata rules), then Semantic V1 only if
 * Core already passed — `validateSemanticV1` returns `[]` on its own when
 * `pkg.semantics` is absent, so this composition is correct for Core-only
 * packages too.
 */
export function validateTemplatePackage(pkg: MarkerTemplatePackage): ConformanceDiagnostic[] {
  const coreDiagnostics = validateCoreV1(pkg)
  if (coreDiagnostics.length > 0) return coreDiagnostics
  return validateSemanticV1(pkg)
}

export function formatDiagnosticsForUser(diagnostics: ConformanceDiagnostic[]): string {
  return diagnostics.map((diagnostic) => diagnostic.message).join("; ")
}
