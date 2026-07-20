import { Prisma, VersionStatus } from "@prisma/client"

export type FormWithLatestVersion = Prisma.MarkerFormGetPayload<{
  include: {
    versions: {
      orderBy: { version: 'desc' }
      take: 1
      include: {
        publishedSchemas: {
          take: 1
          select: { version: true }
        }
      }
    }
  }
}>

/**
 * Client-facing DTOs.
 *
 * Queries map raw Prisma payloads into these flat, serializable shapes before
 * they cross the server -> client boundary. This keeps Prisma internals (and any
 * un-needed columns) out of the browser bundle and gives client components a
 * stable, strongly-typed contract instead of `as any` casts on Json columns.
 */

export interface ContributorDTO {
  name: string
  role: string
  orcid?: string | null
}

export interface PublishedSchemaSummaryDTO {
  pid: string
  version: string
  license: string
  domain: string | null
  language: string
  releaseNotes: string | null
  keywords: string[]
  contributors: ContributorDTO[]
}

export interface PublicationMetadataFieldsDTO {
  domain: string | null
  language: string | null
  license: string | null
  keywords: string[]
  contributors: ContributorDTO[]
}

export interface PublicationMetadataDTO extends PublicationMetadataFieldsDTO {
  updatedAt: Date
}

export interface FormVersionDTO {
  id: number
  name: string
  version: number
  status: VersionStatus
  createdAt: Date
  updatedAt: Date
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown>
  publishedSchema: PublishedSchemaSummaryDTO | null
  publicationMetadata: PublicationMetadataDTO | null
}

export interface FormDetailDTO {
  id: number
  /** Ordered by version descending; index 0 is the latest version. */
  versions: FormVersionDTO[]
}
