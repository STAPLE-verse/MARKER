import type { Prisma } from "@prisma/client"
import type { ContributorAffiliationDTO, PublicationMetadataFieldsDTO, ContributorDTO } from "../types"
import { PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS } from "../constants/publicationMetadataOptions"

export type PublicationMetadataLike = {
  domain?: unknown
  language?: unknown
  license?: unknown
  keywords?: unknown
  contributors?: unknown
}

export const DEFAULT_PUBLICATION_LANGUAGE = "en"
export const DEFAULT_PUBLICATION_LICENSE = "CC-BY-4.0"
export const DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE = "Author"

export const DEFAULT_PUBLICATION_METADATA: PublicationMetadataLike = {
  language: DEFAULT_PUBLICATION_LANGUAGE,
  license: DEFAULT_PUBLICATION_LICENSE,
  keywords: [],
  contributors: [],
}

export interface PublicationMetadataFormContributor {
  name: string
  nameType: "Personal" | "Organizational"
  givenName: string
  familyName: string
  roles: string[]
  orcid: string
  affiliations: ContributorAffiliationDTO[]
}

export interface PublicationMetadataFormValues {
  domain: string
  language: string
  license: string
  keywords: string[]
  contributors: PublicationMetadataFormContributor[]
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNameType(value: unknown): "Personal" | "Organizational" | undefined {
  return value === "Personal" || value === "Organizational" ? value : undefined
}

/**
 * Shared core for "list of raw values -> trimmed, deduped string[]": drops
 * non-strings and blanks, keeps first-seen casing. `caseInsensitive` folds
 * the dedupe key only (used by keywords); roles stay case-sensitive since
 * they're matched verbatim against PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS and
 * marker-template-spec's reserved "Creator" string.
 */
function dedupeTrimmedStrings(raw: unknown, { caseInsensitive = false } = {}): string[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const values: string[] = []

  for (const value of raw) {
    if (typeof value !== "string") continue

    const trimmed = value.trim()
    if (!trimmed) continue

    const key = caseInsensitive ? trimmed.toLocaleLowerCase() : trimmed
    if (seen.has(key)) continue

    seen.add(key)
    values.push(trimmed)
  }

  return values
}

export function normalizeKeywords(raw: unknown): string[] {
  return dedupeTrimmedStrings(raw, { caseInsensitive: true })
}

export function normalizeRoles(raw: unknown): string[] {
  return dedupeTrimmedStrings(raw)
}

export function sortRoles(roles: string[]): string[] {
  return [...roles].sort((a, b) => a.localeCompare(b))
}

/**
 * The single source of truth for a contributor's display/citation `name`.
 * Organizational contributors have no given/family split, so their typed
 * name is authoritative. Personal contributors are assembled from
 * given+family name rather than typed separately, so there's exactly one
 * place a name and its parts can go out of sync with each other — never.
 */
export function assembleContributorName(input: {
  nameType?: "Personal" | "Organizational"
  name?: string
  givenName?: string
  familyName?: string
}): string {
  if (input.nameType === "Organizational") {
    return input.name?.trim() ?? ""
  }

  return [input.givenName, input.familyName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ")
}

export function normalizeAffiliations(raw: unknown): ContributorAffiliationDTO[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const affiliations: ContributorAffiliationDTO[] = []

  for (const value of raw) {
    if (!value || typeof value !== "object") continue

    const name = typeof (value as Record<string, unknown>).name === "string"
      ? ((value as Record<string, unknown>).name as string).trim()
      : ""
    if (!name || seen.has(name)) continue

    seen.add(name)
    affiliations.push({ name })
  }

  return affiliations
}

export function mapContributors(raw: unknown): ContributorDTO[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((contributor): contributor is Record<string, unknown> => {
      return typeof contributor === "object" && contributor !== null
    })
    .map((contributor) => ({
      name: typeof contributor.name === "string" ? contributor.name.trim() : "",
      nameType: normalizeNameType(contributor.nameType),
      givenName: normalizeNullableString(contributor.givenName) ?? undefined,
      familyName: normalizeNullableString(contributor.familyName) ?? undefined,
      roles: normalizeRoles(contributor.roles),
      orcid:
        typeof contributor.orcid === "string" && contributor.orcid.trim()
          ? contributor.orcid.trim()
          : null,
      affiliations: normalizeAffiliations(contributor.affiliations),
    }))
    .filter((contributor) => {
      return Boolean(contributor.name || contributor.roles.length > 0 || contributor.orcid)
    })
}

/**
 * The role checklist offered when editing a contributor: MARKER's fixed
 * suggestions, plus any role already used by another contributor on the same
 * form, plus (via `extraRoles`) whatever's selected in the contributor
 * currently being edited but not yet committed to the field array — so a
 * custom role typed for this contributor appears in its own checklist
 * immediately, not just in everyone else's. Derived live from the form's own
 * data rather than stored anywhere, so nothing needs a new persistence
 * concept for "known custom roles."
 */
export function availableContributorRoles(
  contributors: { roles?: unknown }[],
  extraRoles: string[] = []
): string[] {
  const fixed = PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS.map((option) => option.value)
  const used = contributors.flatMap((contributor) => normalizeRoles(contributor.roles))
  return Array.from(new Set([...fixed, ...used, ...extraRoles]))
}

export function normalizePublicationMetadata(input: PublicationMetadataLike | null | undefined): PublicationMetadataFieldsDTO {
  return {
    domain: normalizeNullableString(input?.domain),
    language: normalizeNullableString(input?.language),
    license: normalizeNullableString(input?.license),
    keywords: normalizeKeywords(input?.keywords),
    contributors: mapContributors(input?.contributors),
  }
}

function contributorsToFormValues(contributors: ContributorDTO[]): PublicationMetadataFormContributor[] {
  return contributors.map((contributor) => ({
    name: contributor.name,
    nameType: contributor.nameType ?? "Personal",
    givenName: contributor.givenName ?? "",
    familyName: contributor.familyName ?? "",
    roles: contributor.roles,
    orcid: contributor.orcid ?? "",
    affiliations: contributor.affiliations ?? [],
  }))
}

export function publicationMetadataToFormValues(
  input: PublicationMetadataLike | null | undefined,
  options: { fallbackContributors?: ContributorDTO[] } = {}
): PublicationMetadataFormValues {
  const metadata = normalizePublicationMetadata(input)
  const contributors = metadata.contributors.length
    ? metadata.contributors
    : options.fallbackContributors ?? []

  return {
    domain: metadata.domain ?? "",
    language: metadata.language ?? DEFAULT_PUBLICATION_LANGUAGE,
    license: metadata.license ?? DEFAULT_PUBLICATION_LICENSE,
    keywords: metadata.keywords,
    contributors: contributorsToFormValues(contributors),
  }
}

export function contributorsToJson(contributors: ContributorDTO[]): Prisma.InputJsonValue {
  return contributors as unknown as Prisma.InputJsonValue
}

export function copyPublicationMetadataFields(input: PublicationMetadataLike | null | undefined): Prisma.PublicationMetadataCreateWithoutFormVersionInput {
  const metadata = normalizePublicationMetadata(input)

  return {
    domain: metadata.domain,
    language: metadata.language,
    license: metadata.license,
    keywords: metadata.keywords,
    contributors: contributorsToJson(metadata.contributors),
  }
}
