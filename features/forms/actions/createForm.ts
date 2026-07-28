"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createFormSchema } from "../schemas"
import {
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
    },
  })
  const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")

  // A nested create is atomic: the MarkerForm and its initial MarkerFormVersion are
  // persisted together or not at all, so no explicit $transaction is needed.
  const form = await prisma.markerForm.create({
    data: {
      ownerId: userId,
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
          publicationMetadata: {
            create: copyPublicationMetadataFields({
              ...DEFAULT_PUBLICATION_METADATA,
              contributors: authorName
                ? [{
                    name: authorName,
                    role: DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
                    orcid: user?.orcid ?? "",
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
