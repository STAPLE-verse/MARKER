"use server"

import { prisma } from "@/lib/db"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { saveFormVersionSchema } from "../schemas"
import { extractSchemaTitle } from "@/utils/schema"
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion"

export const saveFormVersion = authenticatedAction(saveFormVersionSchema, async ({ input, userId }) => {
  const { latestVersion } = await getAuthorizedLatestVersion(input.formId, userId);

  // Extract the title from the JSON schema to keep the database record in sync
  const schemaTitle = extractSchemaTitle(input.schema);

  if (latestVersion.status === "PUBLISHED") {
    throw new ActionError("CONFLICT", "Cannot edit a published form version. Please create a new draft version.");
  }

  // Background Auto-Save mechanism:
  // We update the latest version in-place to prevent database bloat during active editing.
  // Explicit version bumping is handled manually by the user via createFormCheckpoint.
  await prisma.formVersion.update({
    where: { id: latestVersion.id },
    data: {
      name: schemaTitle,
      schema: input.schema,
      uiSchema: input.uiSchema || {}
    }
  })
  
  return { success: true }
})
