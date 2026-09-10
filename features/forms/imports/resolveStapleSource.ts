import { prisma } from "@/lib/db"
import { ActionError } from "@/utils/action-result"

export interface ResolvedStapleVersion {
  sourceFormId: number
  sourceVersionId: number
  sourceVersionNumber: number
  title: string
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | null
  semantics: unknown | null
}

/**
 * Re-reads and authorizes a STAPLE FormVersion for import, independent of
 * whatever the browser's picker page showed. Never trust the client-supplied
 * sourceFormId/sourceVersionId pairing beyond using it to look the row up.
 */
export async function resolveStapleSource(
  sourceFormId: number,
  sourceVersionId: number,
  userId: number
): Promise<ResolvedStapleVersion> {
  const version = await prisma.formVersion.findUnique({
    where: { id: sourceVersionId },
    select: {
      id: true,
      formId: true,
      version: true,
      name: true,
      schema: true,
      uiSchema: true,
      semantics: true,
      archived: true,
      form: { select: { id: true, userId: true, archived: true, app: true } },
    },
  })

  if (!version || version.formId !== sourceFormId) {
    throw new ActionError("NOT_FOUND", "This STAPLE form version could not be found.")
  }
  if (version.form.app !== "staple") {
    throw new ActionError("NOT_FOUND", "This STAPLE form version could not be found.")
  }
  if (version.form.userId !== userId) {
    throw new ActionError("FORBIDDEN", "You do not have permission to import this form.")
  }
  if (version.archived || version.form.archived) {
    throw new ActionError("NOT_FOUND", "This STAPLE form version is no longer available.")
  }

  return {
    sourceFormId: version.form.id,
    sourceVersionId: version.id,
    sourceVersionNumber: version.version,
    title: version.name,
    schema: (version.schema ?? {}) as Record<string, unknown>,
    uiSchema: version.uiSchema as Record<string, unknown> | null,
    semantics: version.semantics,
  }
}
