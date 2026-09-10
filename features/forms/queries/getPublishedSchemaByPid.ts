import { prisma } from "@/lib/db"
import { PublishedSchemaDetailDTO } from "../types"
import { mapContributorsChecked, normalizeKeywordsChecked } from "../utils/publicationMetadata"
import { getVersionsByFamilyIds } from "./publishedSchemaFamilyVersions"

/**
 * Public, unauthenticated lookup for `/schemas/[pid]` — the catalog detail
 * page. No ownership scoping: a published schema's pid is meant to be
 * publicly resolvable by anyone who has it (or finds it via Explore).
 *
 * Returns `authorId`/`originFormId`/`originVersionId` too, on top of the
 * plain `PublicPublishedSchemaDTO` shape — those are for the caller
 * (`app/(public)/schemas/[pid]/page.tsx`) to resolve viewer-specific state
 * (is this the viewer's own schema, which of their draft's versions is this
 * *specific* pid) with `auth()`, server-side, before anything crosses to the
 * client. See `PublishedSchemaDetailDTO`'s own doc comment.
 *
 * `originVersionId` matters, not just `originFormId`: `originFormVersionId`
 * points at the exact `MarkerFormVersion` that was frozen into this pid, not
 * just "some version of this form" — a family can have several published
 * versions, each pointing at a different `MarkerFormVersion` row. Linking to
 * `/collection/[formId]` alone always lands on the *latest* version.
 */
export async function getPublishedSchemaByPid(pid: string): Promise<PublishedSchemaDetailDTO | null> {
  const schema = await prisma.publishedSchema.findUnique({
    where: { pid },
    select: {
      pid: true,
      title: true,
      description: true,
      version: true,
      license: true,
      domain: true,
      language: true,
      keywords: true,
      contributors: true,
      releaseNotes: true,
      relatedPublicationDoi: true,
      schemaJson: true,
      uiSchema: true,
      createdAt: true,
      familyId: true,
      authorId: true,
      derivedFromPid: true,
      originFormVersion: { select: { id: true, formId: true } },
    },
  })

  if (!schema) return null

  const versionsByFamily = await getVersionsByFamilyIds([schema.familyId])

  // `derivedFromPid` is a bare string with no Prisma relation (same shape as
  // MarkerForm.forkedFromPid) — a second lookup, not an `include`. The
  // origin row should always exist (PublishedSchema rows are never
  // deleted), but null-guard anyway rather than let a dangling pointer
  // break the page.
  const forkedFrom = schema.derivedFromPid
    ? await prisma.publishedSchema.findUnique({
        where: { pid: schema.derivedFromPid },
        select: { pid: true, title: true },
      })
    : null

  return {
    pid: schema.pid,
    title: schema.title,
    description: schema.description,
    version: schema.version,
    license: schema.license,
    domain: schema.domain,
    language: schema.language,
    keywords: normalizeKeywordsChecked(schema.pid, schema.keywords),
    contributors: mapContributorsChecked(schema.pid, schema.contributors),
    releaseNotes: schema.releaseNotes,
    relatedPublicationDoi: schema.relatedPublicationDoi,
    schema: (schema.schemaJson ?? {}) as Record<string, unknown>,
    uiSchema: (schema.uiSchema ?? {}) as Record<string, unknown>,
    createdAt: schema.createdAt,
    versions: versionsByFamily.get(schema.familyId) ?? [
      { pid: schema.pid, version: schema.version, createdAt: schema.createdAt },
    ],
    forkedFrom: forkedFrom ? { pid: forkedFrom.pid, title: forkedFrom.title } : null,
    authorId: schema.authorId,
    originFormId: schema.originFormVersion?.formId ?? null,
    originVersionId: schema.originFormVersion?.id ?? null,
  }
}
