"use server"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { generatePID } from "@/utils/id"
import { createFormSchema } from "../schemas"
import {
  assembleContributorName,
  copyPublicationMetadataFields,
  DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
  DEFAULT_PUBLICATION_METADATA,
} from "../utils/publicationMetadata"

export const createForm = authenticatedAction(createFormSchema, async ({ input, userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      orcid: true,
      institution: true,
    },
  })
  const authorName = assembleContributorName({
    nameType: "Personal",
    givenName: user?.firstName ?? undefined,
    familyName: user?.lastName ?? undefined,
  })

  // A nested create is atomic: the MarkerForm and its initial MarkerFormVersion are
  // persisted together or not at all, so no explicit $transaction is needed.
  const form = await prisma.markerForm.create({
    data: {
      ownerId: userId,
      // marker-template-spec Core V1 metadata.familyId: minted once here, never
      // reassigned. This is the only code path that creates a new MarkerForm row,
      // so it is the only place a new familyId is ever minted.
      familyId: generatePID("mf"),
      versions: {
        create: {
          name: input.title,
          version: 1,
          schema: {
            title: input.title,
            description: input.description || "",
            type: "object",
            properties: {}
          },
          uiSchema: {},
          // Native creation never takes semantics as input — every native
          // template starts Core-only.
          semantics: Prisma.JsonNull,
          // marker-template-spec Core V1 metadata.versionId (draft phase).
          versionId: generatePID("mv"),
          publicationMetadata: {
            create: copyPublicationMetadataFields({
              ...DEFAULT_PUBLICATION_METADATA,
              contributors: authorName
                ? [{
                    name: authorName,
                    nameType: "Personal",
                    givenName: user?.firstName ?? undefined,
                    familyName: user?.lastName ?? undefined,
                    // The form's own author is definitionally its creator.
                    roles: [DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE, "Creator"],
                    orcid: user?.orcid ?? "",
                    affiliations: user?.institution ? [{ name: user.institution }] : undefined,
                  }]
                : [],
            }),
          },
        }
      }
    }
  })

  revalidatePath("/collection")
  return form.id
})
