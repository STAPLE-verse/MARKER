"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { generatePID } from "@/utils/id"
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
      tx.markerFormVersion.create({
        data: {
          formId: input.formId,
          version: latestVersion.version + 1,
          name: schemaTitle,
          schema: input.schema,
          uiSchema: input.uiSchema || {},
          semantics: input.semantics ?? Prisma.JsonNull,
          // A new MarkerFormVersion row under the same, existing MarkerForm —
          // mint a fresh versionId; familyId is untouched (it lives on the
          // parent MarkerForm and isn't written here).
          versionId: generatePID("mv"),
          // Continuation of the same lineage, not a new import — carry the
          // previous version's own STAPLE provenance forward unchanged.
          importedFromStapleVersionNumber: latestVersion.importedFromStapleVersionNumber,
          importedAt: latestVersion.importedAt,
          originalImportHash: latestVersion.originalImportHash,
        },
      })
  )

  revalidatePath(`/collection/${input.formId}`)
  revalidatePath(`/collection/${input.formId}/edit`)
  revalidatePath("/collection")

  return { version: newVersion.version }
})
