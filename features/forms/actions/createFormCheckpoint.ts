"use server"

import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { saveFormVersionSchema } from "../schemas"
import { extractSchemaTitle } from "@/utils/schema"
import {
  parseExpectedUpdatedAt,
  withLockedEditableFormVersionHead,
} from "../queries/formVersionConcurrency"

export const createFormCheckpoint = authenticatedAction(saveFormVersionSchema, async ({ input, userId }) => {
  const expectedUpdatedAt = parseExpectedUpdatedAt(input.expectedUpdatedAt)
  const schemaTitle = extractSchemaTitle(input.schema)

  const newVersion = await withLockedEditableFormVersionHead(
    input.formId,
    userId,
    input.formVersionId,
    expectedUpdatedAt,
    (tx, { latestVersion }) =>
      tx.formVersion.create({
        data: {
          formId: input.formId,
          version: latestVersion.version + 1,
          name: schemaTitle,
          schema: input.schema,
          uiSchema: input.uiSchema || {},
        },
      })
  )

  revalidatePath(`/collection/${input.formId}`)
  revalidatePath(`/collection/${input.formId}/edit`)
  revalidatePath("/collection")

  return { version: newVersion.version }
})
