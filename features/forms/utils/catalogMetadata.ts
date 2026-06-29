import type { Prisma } from "@prisma/client"
import type { CatalogMetadataDTO, ContributorDTO } from "../types"

export type CatalogMetadataLike = {
  domain?: unknown
  language?: unknown
  license?: unknown
  keywords?: unknown
  contributors?: unknown
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

export function normalizeCatalogMetadata(input: CatalogMetadataLike | null | undefined): CatalogMetadataDTO {
  return {
    domain: normalizeNullableString(input?.domain),
    language: normalizeNullableString(input?.language),
    license: normalizeNullableString(input?.license),
    keywords: normalizeKeywords(input?.keywords),
    contributors: mapContributors(input?.contributors),
  }
}

export function copyMetadataFields(input: CatalogMetadataLike | null | undefined): Prisma.PublicationMetadataCreateWithoutFormVersionInput {
  const metadata = normalizeCatalogMetadata(input)

  return {
    domain: metadata.domain,
    language: metadata.language,
    license: metadata.license,
    keywords: metadata.keywords,
    contributors: metadata.contributors as unknown as Prisma.InputJsonValue,
  }
}
