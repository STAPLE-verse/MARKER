import { Prisma } from "@prisma/client"

/**
 * Canonical definition of a form's "latest version" (architecture.md §8.5).
 *
 * The latest version is the highest-numbered `FormVersion` that has **not** been
 * archived. Every read and write path spreads one of these selectors into the
 * Prisma `versions` relation arg instead of re-declaring the filter inline, so
 * "latest" provably means the same thing everywhere and we can extend the rule
 * (e.g. add a soft-delete column) in exactly one place.
 */

/** Only versions that are part of a form's active history. */
export const nonArchivedVersionFilter = {
  archived: false,
} satisfies Prisma.FormVersionWhereInput

/**
 * All non-archived versions, newest first. Use when a callsite needs the full
 * (active) version history, e.g. the form detail page.
 */
export const nonArchivedVersionsArgs = {
  where: nonArchivedVersionFilter,
  orderBy: { version: "desc" },
} satisfies Prisma.Form$versionsArgs

/**
 * The single latest non-archived version. Use when a callsite only needs the
 * current head of the version history (list rows, edit/save/publish actions).
 */
export const latestVersionArgs = {
  ...nonArchivedVersionsArgs,
  take: 1,
} satisfies Prisma.Form$versionsArgs
