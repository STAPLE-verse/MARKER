"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createFormSchema } from "../schemas"
import { copyMetadataFields, DEFAULT_PUBLICATION_METADATA } from "../utils/catalogMetadata"

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

  // A nested create is atomic: the Form and its initial FormVersion are
  // persisted together or not at all, so no explicit $transaction is needed.
  const form = await prisma.form.create({
    data: {
      app: "marker",
      userId,
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
            create: copyMetadataFields({
              ...DEFAULT_PUBLICATION_METADATA,
              contributors: authorName
                ? [{
                    name: authorName,
                    role: "Author",
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
