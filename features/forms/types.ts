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
 * One sibling version within a `PublishedSchema` family, newest first —
 * lets both the `/explore` card's version picker and `/schemas/[pid]`'s
 * version-history sidebar link across a family without re-fetching.
 */
export interface PublishedSchemaVersionDTO {
  pid: string
  version: string
  createdAt: Date
}

/**
 * One row in the public `/explore` catalog — one per `familyId` (latest
 * version only; see `docs/refactor/explore.md` §2.2). Deliberately reuses
 * `ContributorDTO` rather than a narrower shape: the card needs the same
 * "first contributor + role" info the `/schemas/[pid]` detail page already
 * knows how to render.
 *
 * `versions` always includes this row's own version and is sorted newest
 * first; length 1 means this family has never had another version published.
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
  createdAt: Date
  versions: PublishedSchemaVersionDTO[]
}

/**
 * One row in `/collection`'s "Published" tab — the user's own published
 * schemas, one per family (latest published version only), same convention
 * as `/explore`'s `PublishedSchemaCardDTO` rather than one row per historical
 * version.
 */
export interface UserPublishedSchemaDTO {
  pid: string
  title: string
  version: string
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
 *
 * `versions` (see `PublishedSchemaVersionDTO`) is every published version in
 * this schema's family, newest first, always including this row's own
 * version — feeds the version-history sidebar.
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
  versions: PublishedSchemaVersionDTO[]
  /** Set when this schema's `derivedFromPid` resolves to another published schema — the fork lineage `architecture.md` describes. `null` for a schema with no fork ancestry (or a dangling pointer, which shouldn't happen). */
  forkedFrom: { pid: string; title: string } | null
}

/**
 * `getPublishedSchemaByPid`'s actual return shape — the public
 * `PublicPublishedSchemaDTO` plus two fields that must NEVER reach the
 * client directly: `authorId` (another user's numeric id) and
 * `originFormId` (a MarkerForm id, only meaningful to its owner). Both exist
 * solely for `app/(public)/schemas/[pid]/page.tsx` to resolve viewer-specific
 * state server-side (via `auth()`) — is the viewer the author, what's their
 * draft's formId — before stripping them and passing the rest down to
 * `SchemaDetailsClient`.
 */
export interface PublishedSchemaDetailDTO extends PublicPublishedSchemaDTO {
  authorId: number
  originFormId: number | null
  /** The exact `MarkerFormVersion.id` frozen into this pid — not just "a" version of `originFormId`'s form. See `getPublishedSchemaByPid`'s doc comment. */
  originVersionId: number | null
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
  /** Always `MarkerForm.ownerId`, regardless of the caller's own role. */
  ownerId: number
  /**
   * The caller's own resolved role (docs/refactor/form-collaboration.md §4.6)
   * — OWNER via `MarkerForm.ownerId`, EDITOR/VIEWER via a `MarkerFormCollaborator`
   * row, accepted *or* still-pending (see `isPendingInvite`). Write actions
   * re-check role from an accepted-only row server-side regardless, so this
   * alone is never a permission grant — it's what to *display*. Any UI that
   * uses `role` to gate an edit affordance must also check `!isPendingInvite`;
   * a pending row's invited role otherwise reads as fully granted.
   */
  role: "OWNER" | "EDITOR" | "VIEWER"
  /**
   * True when `role` comes from a `MarkerFormCollaborator` row this viewer
   * hasn't accepted yet — they can see the form (read-only, regardless of
   * the invited role) so they can act on the invite from the page itself,
   * but have none of `role`'s actual permissions until they accept.
   */
  isPendingInvite: boolean
  /** The `MarkerFormCollaborator.id` to pass to accept/decline — set only when `isPendingInvite` is true. */
  pendingCollaboratorId: number | null
  /** True if any version has a related PublishedSchema (blocks permanent delete). */
  hasPublishedVersion: boolean
  /** Ordered by version descending; index 0 is the latest version. */
  versions: FormVersionDTO[]
  stapleImport: StapleImportInfoDTO | null
  /**
   * Present only when `MarkerForm.origin === "FORKED"`. Unlike `stapleImport`,
   * this is form-level in the literal sense too — a fork happens once, at
   * `MarkerForm` creation, so it applies unchanged to every version of the
   * form (no per-version provenance/recurrence the way a STAPLE update-import
   * has). `null` if the origin `PublishedSchema` row is somehow gone (should
   * be unreachable — those rows are never deleted — but not fabricated).
   */
  forkedFrom: { pid: string; title: string } | null
}
