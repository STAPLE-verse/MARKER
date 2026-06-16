"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { saveFormVersionSchema } from "../schemas"
import { extractSchemaTitle } from "@/utils/schema"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"

export const createFormCheckpoint = authenticatedAction(saveFormVersionSchema, async ({ input, userId }) => {
  const { latestVersion } = await getAuthorizedLatestVersion(input.formId, userId);

  const schemaTitle = extractSchemaTitle(input.schema);

  // Create a new FormVersion row to act as an explicit checkpoint
  await prisma.formVersion.create({
    data: {
      formId: input.formId,
      version: latestVersion.version + 1,
      name: schemaTitle,
      schema: input.schema,
      uiSchema: input.uiSchema || {}
    }
  })

  revalidatePath(`/collection/${input.formId}/edit`)
  revalidatePath("/collection")
  
  return { success: true }
})
