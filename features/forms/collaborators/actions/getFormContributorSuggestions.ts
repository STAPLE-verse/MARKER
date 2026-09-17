"use server"

import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { getAuthorizedLatestVersion } from "../../queries/getAuthorizedLatestVersion"
import { formIdActionSchema } from "../../schemas"
import type { ContributorSuggestionDTO } from "../types"

/**
 * Publish-time contributor suggestions (docs/refactor/form-collaboration.md
 * §4.7) — the owner plus every accepted collaborator, any role (someone
 * might deserve publication credit without EDITOR access, and vice versa).
 * Read-only, so the minimum role is VIEWER — anyone who can see the form can
 * see who else might be worth crediting.
 *
 * Dedup against the current, in-progress contributor list happens
 * client-side (`PublicationContributorsFields.tsx`) — this action has no
 * visibility into unsaved form state, only the DB.
 */
export const getFormContributorSuggestions = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }): Promise<ContributorSuggestionDTO[]> => {
    const { form } = await getAuthorizedLatestVersion(input.formId, userId, prisma, "VIEWER")

    const collaborators = await prisma.markerFormCollaborator.findMany({
      where: { formId: input.formId, acceptedAt: { not: null } },
      select: { userId: true },
    })
    const userIds = [...new Set([form.ownerId, ...collaborators.map((c) => c.userId)])]

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, orcid: true, institution: true },
    })

    return users.flatMap((u): ContributorSuggestionDTO[] => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
      // No name on file — nothing meaningful to suggest, same bar
      // `createForm.ts`'s owner-seed applies (`authorName ? [...] : []`).
      if (!name) return []
      return [
        {
          userId: u.id,
          name,
          givenName: u.firstName ?? undefined,
          familyName: u.lastName ?? undefined,
          orcid: u.orcid ?? undefined,
          affiliations: u.institution ? [{ name: u.institution }] : [],
        },
      ]
    })
  }
)
