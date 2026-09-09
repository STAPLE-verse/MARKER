import { prisma } from "@/lib/db"
import { getImportModificationStatus, type ImportModificationStatus } from "../../utils/importHash"

export interface StapleImportVersionDTO {
  id: number
  version: number
  name: string
  createdAt: string
}

export interface MarkerImportTargetDTO {
  id: number
  latestName: string
  latestVersion: number
  importedSourceVersion: number | null
  // Drives the §6a overwrite-confirmation step — never UNKNOWN here since
  // every IMPORTED_STAPLE form has an originalImportHash.
  modificationStatus: ImportModificationStatus
}

export interface StapleImportFormDTO {
  id: number
  latestName: string
  versions: StapleImportVersionDTO[]
  markerTargets: MarkerImportTargetDTO[]
}

/**
 * Metadata-only DTOs for the STAPLE import picker (docs/refactor/import.md
 * §8.5 "metadata-only list of owned STAPLE forms and versions"). STAPLE
 * source schema/uiSchema are never read here — those are only resolved
 * authoritatively inside a Server Action. The MARKER *target*'s current
 * schema/uiSchema are read, but only to compute `modificationStatus`; they
 * are never included in the returned DTO.
 */
export async function getStapleImportOptions(userId: number): Promise<StapleImportFormDTO[]> {
  const forms = await prisma.form.findMany({
    where: { userId, app: "staple", archived: false },
    select: {
      id: true,
      versions: {
        where: { archived: false },
        orderBy: { version: "desc" },
        select: { id: true, version: true, name: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const targets = await prisma.markerForm.findMany({
    where: {
      ownerId: userId,
      archived: false,
      origin: "IMPORTED_STAPLE",
      importedFromStapleFormId: { in: forms.map((form) => form.id) },
    },
    select: {
      id: true,
      importedFromStapleFormId: true,
      importedFromStapleVersionNumber: true,
      originalImportHash: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { name: true, version: true, schema: true, uiSchema: true },
      },
    },
  })

  return forms
    .filter((form) => form.versions.length > 0)
    .map((form) => ({
      id: form.id,
      latestName: form.versions[0].name,
      versions: form.versions.map((version) => ({
        id: version.id,
        version: version.version,
        name: version.name,
        createdAt: version.createdAt.toISOString(),
      })),
      markerTargets: targets
        .filter((target) => target.importedFromStapleFormId === form.id)
        .map((target) => {
          const head = target.versions[0]
          return {
            id: target.id,
            latestName: head?.name ?? "Untitled",
            latestVersion: head?.version ?? 0,
            importedSourceVersion: target.importedFromStapleVersionNumber,
            modificationStatus: getImportModificationStatus({
              latestImportedContentHash: target.originalImportHash,
              schema: (head?.schema ?? {}) as Record<string, unknown>,
              uiSchema: head?.uiSchema as Record<string, unknown> | null,
            }),
          }
        }),
    }))
}
