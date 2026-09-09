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

export interface ContributorAffiliationDTO {
  name: string
}

export interface ContributorDTO {
  name: string
  nameType?: "Personal" | "Organizational"
  givenName?: string
  familyName?: string
  roles: string[]
  orcid?: string | null
  affiliations?: ContributorAffiliationDTO[]
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

/**
 * Full public-facing shape for `/schemas/[pid]` — the catalog detail page.
 * Sourced from `PublishedSchema`'s normalized columns (fast, already
 * display-shaped), not `PublishedSchemaPackage.packageJson` (the frozen
 * marker-template-spec snapshot, reserved for export/interop — see its own
 * schema.prisma comment on why it's kept separate).
 */
export interface PublicPublishedSchemaDTO {
  pid: string
  title: string
  description: string | null
  version: string
  license: string
  domain: string | null
  language: string
  keywords: string[]
  contributors: ContributorDTO[]
  releaseNotes: string | null
  relatedPublicationDoi: string | null
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown>
  createdAt: Date
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
  semantics: Record<string, unknown> | null
  publishedSchema: PublishedSchemaSummaryDTO | null
  publicationMetadata: PublicationMetadataDTO | null
}

export interface FormDetailDTO {
  id: number
  archived: boolean
  /** True if any version has a related PublishedSchema (blocks permanent delete). */
  hasPublishedVersion: boolean
  /** Ordered by version descending; index 0 is the latest version. */
  versions: FormVersionDTO[]
}
