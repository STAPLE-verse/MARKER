import { Prisma } from "@prisma/client"

/**
 * Canonical definition of a form's "latest version" (architecture.md §8.5).
 *
 * The latest version is the highest-numbered `MarkerFormVersion` that has **not** been
 * archived. Every read and write path spreads one of these selectors into the
 * Prisma `versions` relation arg instead of re-declaring the filter inline, so
 * "latest" provably means the same thing everywhere and we can extend the rule
 * (e.g. add a soft-delete column) in exactly one place.
 */

/** Only versions that are part of a form's active history. */
export const nonArchivedVersionFilter = {
  archived: false,
} satisfies Prisma.MarkerFormVersionWhereInput

/**
 * All non-archived versions, newest first. Composed into `latestVersionArgs`;
 * use directly when a callsite needs the full active history via a relation include.
 */
export const nonArchivedVersionsArgs = {
  where: nonArchivedVersionFilter,
  orderBy: { version: "desc" },
} satisfies Prisma.MarkerForm$versionsArgs

/**
 * The single latest non-archived version. Use when a callsite only needs the
 * current head of the version history (list rows, edit/save/publish actions).
 */
export const latestVersionArgs = {
  ...nonArchivedVersionsArgs,
  take: 1,
} satisfies Prisma.MarkerForm$versionsArgs

/**
 * Highest-numbered version regardless of `archived`. Use for archived-form
 * list/detail surfaces where soft-delete has marked every version archived
 * (see docs/form-delete-policy.md §4.3 Step 1).
 */
export const latestVersionAnyArgs = {
  orderBy: { version: "desc" },
  take: 1,
} satisfies Prisma.MarkerForm$versionsArgs
