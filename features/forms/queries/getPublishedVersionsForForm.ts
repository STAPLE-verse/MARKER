import { prisma } from "@/lib/db"

/**
 * All published version strings for the schema family a MarkerForm belongs
 * to — used by the publish wizard to suggest the next version and flag
 * already-taken ones before the user submits. Advisory only: the DB's
 * `@@unique([familyId, version])` constraint (see publishSchema.ts) remains
 * the authoritative gate against a concurrent publish happening elsewhere
 * while the wizard is open.
 */
export async function getPublishedVersionsForForm(formId: number): Promise<string[]> {
  const form = await prisma.markerForm.findUnique({
    where: { id: formId },
    select: { familyId: true },
  })
  if (!form) return []

  const rows = await prisma.publishedSchema.findMany({
    where: { familyId: form.familyId },
    select: { version: true },
  })
  return rows.map((row) => row.version)
}
