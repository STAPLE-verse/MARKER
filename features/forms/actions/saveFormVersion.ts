"use server"

import { VersionStatus } from "@prisma/client"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { saveFormVersionSchema } from "../schemas"
import { extractSchemaTitle } from "@/utils/schema"
import {
  CONCURRENT_EDIT_MESSAGE,
  parseExpectedUpdatedAt,
  withLockedEditableFormVersionHead,
} from "../queries/formVersionConcurrency"

export const saveFormVersion = authenticatedAction(saveFormVersionSchema, async ({ input, userId }) => {
  const expectedUpdatedAt = parseExpectedUpdatedAt(input.expectedUpdatedAt)
  const schemaTitle = extractSchemaTitle(input.schema)

  return withLockedEditableFormVersionHead(
    input.formId,
    userId,
    input.formVersionId,
    expectedUpdatedAt,
    async (tx) => {
      const result = await tx.formVersion.updateMany({
        where: {
          id: input.formVersionId,
          formId: input.formId,
          updatedAt: expectedUpdatedAt,
          archived: false,
          status: VersionStatus.DRAFT,
        },
        data: {
          name: schemaTitle,
          schema: input.schema,
          uiSchema: input.uiSchema || {},
        },
      })

      if (result.count === 0) {
        throw new ActionError("CONFLICT", CONCURRENT_EDIT_MESSAGE)
      }

      const saved = await tx.formVersion.findUniqueOrThrow({
        where: { id: input.formVersionId },
        select: { updatedAt: true },
      })

      return { updatedAt: saved.updatedAt.toISOString() }
    }
  )
})
