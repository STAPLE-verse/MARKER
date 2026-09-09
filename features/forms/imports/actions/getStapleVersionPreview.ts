"use server"

import { authenticatedAction } from "@/utils/safe-action"
import { getStapleVersionPreviewSchema } from "../../schemas"
import { resolveStapleSource } from "../resolveStapleSource"

/**
 * Read-only preview for the import modal — reuses `resolveStapleSource`
 * verbatim (same ownership/archived authorization as the real import), just
 * without persisting anything. Never trust this response for the actual
 * import: `importFromStaple` re-resolves from scratch when the user commits.
 * Deliberately drops `semantics` — the preview only feeds the JSON Source /
 * Form Preview tabs, neither of which render semantic bindings.
 */
export const getStapleVersionPreview = authenticatedAction(
  getStapleVersionPreviewSchema,
  async ({ input, userId }) => {
    const source = await resolveStapleSource(input.sourceFormId, input.sourceVersionId, userId)
    return { schema: source.schema, uiSchema: source.uiSchema ?? {} }
  }
)
