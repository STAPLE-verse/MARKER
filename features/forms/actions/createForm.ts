"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { createFormSchema } from "../schemas"

export const createForm = authenticatedAction(createFormSchema, async ({ input, userId }) => {
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
          uiSchema: {}
        }
      }
    }
  })

  revalidatePath("/collection")
  return form.id
})
