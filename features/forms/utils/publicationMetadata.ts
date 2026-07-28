import type { Prisma } from "@prisma/client"
import type { PublicationMetadataFieldsDTO, ContributorDTO } from "../types"

export type PublicationMetadataLike = {
  domain?: unknown
  language?: unknown
  license?: unknown
  keywords?: unknown
  contributors?: unknown
}

export const DEFAULT_PUBLICATION_LANGUAGE = "en"
export const DEFAULT_PUBLICATION_LICENSE = "CC-BY 4.0"
export const DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE = "Author"

export const DEFAULT_PUBLICATION_METADATA: PublicationMetadataLike = {
  language: DEFAULT_PUBLICATION_LANGUAGE,
  license: DEFAULT_PUBLICATION_LICENSE,
  keywords: [],
  contributors: [],
}

export interface PublicationMetadataFormContributor {
  name: string
  role: string
  orcid: string
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

export function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const keywords: string[] = []

  for (const value of raw) {
    if (typeof value !== "string") continue

    const keyword = value.trim()
    if (!keyword) continue

    const key = keyword.toLocaleLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    keywords.push(keyword)
  }

  return keywords
}

export function mapContributors(raw: unknown): ContributorDTO[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((contributor): contributor is Record<string, unknown> => {
      return typeof contributor === "object" && contributor !== null
    })
    .map((contributor) => ({
      name: typeof contributor.name === "string" ? contributor.name.trim() : "",
      role: typeof contributor.role === "string" ? contributor.role.trim() : "",
      orcid:
        typeof contributor.orcid === "string" && contributor.orcid.trim()
          ? contributor.orcid.trim()
          : null,
    }))
    .filter((contributor) => {
      return Boolean(contributor.name || contributor.role || contributor.orcid)
    })
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
    role: contributor.role,
    orcid: contributor.orcid ?? "",
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
