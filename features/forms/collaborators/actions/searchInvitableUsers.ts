"use server"

import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { searchInvitableUsersSchema } from "../schemas"
import type { InvitableUserDTO } from "../types"

const MAX_RESULTS = 8
const MIN_QUERY_LENGTH = 2

function isEmailLike(query: string): boolean {
  return query.includes("@")
}

/**
 * Feeds the invite-search dropdown (docs/refactor/form-collaboration.md §4.4,
 * §6 item 1). Two different match rules, not one — no email or username is
 * exposed anywhere else in the app today, so a naive substring search over
 * email would be this app's first user-enumeration surface:
 *
 * - a username-shaped query does a live, case-insensitive prefix match
 *   (usernames are already effectively public handles);
 * - an email-shaped query (contains "@") only matches on full equality — a
 *   card appears only once the typed string is a complete, valid email
 *   matching one account, never on a partial substring.
 */
export const searchInvitableUsers = authenticatedAction(
  searchInvitableUsersSchema,
  async ({ input, userId }): Promise<InvitableUserDTO[]> => {
    const { form } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "OWNER")

    const query = input.query.trim()
    if (query.length < MIN_QUERY_LENGTH) return []

    const matchWhere = isEmailLike(query)
      ? { email: { equals: query, mode: "insensitive" as const } }
      : { username: { startsWith: query, mode: "insensitive" as const } }

    const existing = await prisma.markerFormCollaborator.findMany({
      where: { formId: input.formId },
      select: { userId: true },
    })
    const excludedIds = [form.ownerId, ...existing.map((c) => c.userId)]

    const users = await prisma.user.findMany({
      where: { ...matchWhere, id: { notIn: excludedIds } },
      select: { id: true, username: true, firstName: true, lastName: true, email: true, gravatar: true },
      take: MAX_RESULTS,
    })

    return users.map((u) => ({
      userId: u.id,
      username: u.username,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
      avatarEmail: u.gravatar || u.email,
    }))
  }
)
