import { Prisma, VersionStatus } from "@prisma/client"
import type { ImportModificationStatus } from "./utils/importHash"

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

/**
 * One row in the public `/explore` catalog — one per `familyId` (latest
 * version only; see `docs/refactor/explore.md` §2.2). Deliberately reuses
 * `ContributorDTO` rather than a narrower shape: the card needs the same
 * "first contributor + role" info the `/schemas/[pid]` detail page already
 * knows how to render.
 *
 * `authorName` is the publishing `User`'s display name
 * (`firstName`/`lastName`), included only as a fallback for the rare row
 * whose `contributors` comes back empty (see `docs/refactor/explore.md`
 * §2.1) — MARKER's own model has no elevated "author" concept otherwise.
 */
export interface PublishedSchemaCardDTO {
  pid: string
  title: string
  description: string | null
  version: string
  domain: string | null
  language: string
  license: string
  source: string
  keywords: string[]
  contributors: ContributorDTO[]
  authorName: string | null
  createdAt: Date
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

/**
 * This version's own frozen STAPLE provenance — distinct from
 * `StapleImportInfoDTO` below, which is form-level and mutable (always the
 * *most recent* import). `null` for a version that isn't itself part of a
 * STAPLE import lineage (native forms, and any version predating this
 * field's introduction — never backfilled/fabricated).
 *
 * `modificationStatus` compares THIS version's own content against its own
 * frozen baseline hash (`originalImportHash`) — unlike `StapleImportInfoDTO`'s
 * form-level status, this is meaningful on historical versions too, since
 * both the content and the baseline are frozen at the row's creation. `null`
 * baseline (pre-migration rows) yields "UNKNOWN".
 *
 * `isDirectImport` is true only for the row created BY the import
 * transaction itself — false for every descendant (native edit or restore)
 * that merely carries the same lineage forward, even one that's currently
 * `UNMODIFIED`. Never backfilled for versions predating this field.
 */
export interface VersionStapleProvenanceDTO {
  sourceVersionNumber: number
  importedAt: Date
  modificationStatus: ImportModificationStatus
  isDirectImport: boolean
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
  stapleProvenance: VersionStapleProvenanceDTO | null
}

/**
 * Present only when `MarkerForm.origin === "IMPORTED_STAPLE"`. `modificationStatus`
 * reflects the current latest version against the most recent import's
 * baseline hash (docs/refactor/import.md §8.4) — never the version currently
 * being viewed, if that's an older one.
 */
export interface StapleImportInfoDTO {
  sourceFormId: number
  sourceVersionNumber: number | null
  importedAt: Date | null
  modificationStatus: ImportModificationStatus
}

export interface FormDetailDTO {
  id: number
  archived: boolean
  /** True if any version has a related PublishedSchema (blocks permanent delete). */
  hasPublishedVersion: boolean
  /** Ordered by version descending; index 0 is the latest version. */
  versions: FormVersionDTO[]
  stapleImport: StapleImportInfoDTO | null
}
