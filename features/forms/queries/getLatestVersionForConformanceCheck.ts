import { prisma } from "@/lib/db"
import { latestVersionArgs } from "./versionSelectors"

export interface ConformanceCheckVersion {
  familyId: string
  name: string
  version: number
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | null
  semantics: unknown | null
  versionId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Read-side lookup of exactly the raw fields needed to assemble a draft
 * marker-template-spec package for the publish wizard's entry gate (see
 * docs/refactor/publish-wizard-refactor.md, Phase 3a). Deliberately separate
 * from `getFormById`/`FormVersionDTO`: `familyId` and the draft-phase
 * `versionId` are internal opaque identifiers with no reason to reach a
 * client component, so they're kept out of the DTO shared with the wizard
 * UI rather than added to it.
 */
export async function getLatestVersionForConformanceCheck(
  formId: number,
  userId: number
): Promise<ConformanceCheckVersion | null> {
  const form = await prisma.markerForm.findFirst({
    where: { id: formId, ownerId: userId },
    select: {
      familyId: true,
      versions: {
        ...latestVersionArgs,
        select: {
          name: true,
          version: true,
          schema: true,
          uiSchema: true,
          semantics: true,
          versionId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  const latestVersion = form?.versions[0]
  if (!form || !latestVersion) return null

  return {
    familyId: form.familyId,
    name: latestVersion.name,
    version: latestVersion.version,
    schema: (latestVersion.schema ?? {}) as Record<string, unknown>,
    uiSchema: latestVersion.uiSchema as Record<string, unknown> | null,
    semantics: latestVersion.semantics,
    versionId: latestVersion.versionId,
    createdAt: latestVersion.createdAt,
    updatedAt: latestVersion.updatedAt,
  }
}
