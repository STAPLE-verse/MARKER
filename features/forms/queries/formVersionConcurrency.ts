import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"
import { getAuthorizedLatestVersion } from "./getAuthorizedLatestVersion"

type AuthorizedLatestVersion = Awaited<ReturnType<typeof getAuthorizedLatestVersion>>

/** Parse an ISO timestamp from the client into a Date for DB comparison. */
export function parseExpectedUpdatedAt(iso: string): Date {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    throw new ActionError("VALIDATION", "Invalid version timestamp.")
  }
  return parsed
}

/**
 * Serializes operations that depend on a form's current head.
 *
 * The initial authorization check preserves the granular error policy without
 * holding a row lock for obviously invalid requests. Authorization and latest
 * version selection are repeated after locking the parent Form row, so the
 * callback receives a head that cannot be superseded by another cooperating
 * write until this transaction commits.
 */
export async function withLockedAuthorizedLatestVersion<T>(
  formId: number,
  userId: number,
  callback: (
    tx: Prisma.TransactionClient,
    context: AuthorizedLatestVersion
  ) => Promise<T>
): Promise<T> {
  await getAuthorizedLatestVersion(formId, userId)

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "Form"
      WHERE "id" = ${formId}
      FOR UPDATE
    `

    const context = await getAuthorizedLatestVersion(formId, userId, tx)
    return callback(tx, context)
  })
}

/**
 * Runs an operation only when the client-loaded version is still the editable
 * head and its optimistic-concurrency timestamp is unchanged.
 */
export async function withLockedEditableFormVersionHead<T>(
  formId: number,
  userId: number,
  formVersionId: number,
  expectedUpdatedAt: Date,
  callback: (
    tx: Prisma.TransactionClient,
    context: AuthorizedLatestVersion
  ) => Promise<T>
): Promise<T> {
  return withLockedAuthorizedLatestVersion(formId, userId, async (tx, context) => {
    const { latestVersion } = context

    if (latestVersion.id !== formVersionId) {
      throw new ActionError(
        "CONFLICT",
        "This form has a newer draft. Reload the editor to continue."
      )
    }

    if (latestVersion.status === "PUBLISHED") {
      throw new ActionError(
        "CONFLICT",
        "Cannot edit a published form version. Please create a new draft version."
      )
    }

    if (latestVersion.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new ActionError("CONFLICT", CONCURRENT_EDIT_MESSAGE)
    }

    return callback(tx, context)
  })
}

export const CONCURRENT_EDIT_MESSAGE =
  "This draft was updated in another window. Reload the editor to see the latest changes."
