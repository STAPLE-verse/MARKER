"use server"

import { Prisma } from "@prisma/client"
import type { MarkerTemplatePackage } from "@staple-verse/marker-template-runtime"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { generatePID } from "@/utils/id"
import { createNotification } from "@/features/notifications/actions/createNotification"
import { forkSchemaSchema } from "../schemas"
import {
  assembleContributorName,
  copyPublicationMetadataFields,
  DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE,
  DEFAULT_PUBLICATION_METADATA,
} from "../utils/publicationMetadata"

/**
 * Reads from the frozen `PublishedSchemaPackage.packageJson` snapshot, not
 * `PublishedSchema.schemaJson`/`.uiSchema` — those columns encode the same
 * content but the package is the only place `semantics` exists at all (see
 * docs/refactor/explore.md's fork-planning discussion). publishSchema.ts
 * always creates both rows together in one transaction, so a missing
 * snapshot means data corruption, not a legacy row to gracefully degrade.
 */
function resolveForkedContent(published: {
  packageSnapshot: { packageJson: unknown } | null
}): { schema: Record<string, unknown>; uiSchema: Record<string, unknown>; semantics: unknown } {
  if (!published.packageSnapshot) {
    throw new ActionError("NOT_FOUND", "This published schema has no package snapshot and cannot be forked.")
  }
  const pkg = published.packageSnapshot.packageJson as unknown as MarkerTemplatePackage
  return {
    schema: pkg.form.schema as Record<string, unknown>,
    uiSchema: (pkg.form.uiSchema ?? {}) as Record<string, unknown>,
    semantics: pkg.semantics ?? null,
  }
}

export const forkSchema = authenticatedAction(forkSchemaSchema, async ({ input, userId }) => {
  const published = await prisma.publishedSchema.findUnique({
    where: { pid: input.publishedSchemaPid },
    select: {
      pid: true,
      title: true,
      authorId: true,
      packageSnapshot: { select: { packageJson: true } },
      // Only used to build the fork notification's deep link back to the
      // original author's own draft — see the `createNotification` call below.
      originFormVersion: { select: { formId: true } },
    },
  })

  if (!published) {
    throw new ActionError("NOT_FOUND", "This published schema could not be found.")
  }

  // Forking your own published schema is allowed, deliberately — cloning the
  // live draft (the "Clone" action on /collection/[id]) also makes an
  // independent copy, but without provenance (no forkedFromPid, no "Forked"
  // badge). Forking is the only way to get an explicit, traceable lineage
  // back to *this* published version, which is a legitimate reason to want
  // it even with full draft access. See ForkSchemaButton.tsx.
  const { schema, uiSchema, semantics } = resolveForkedContent(published)

  const newName = `Copy of ${published.title || "Untitled Schema"}`
  const newSchema = { ...schema, title: newName }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, firstName: true, lastName: true, orcid: true },
  })
  const authorName = assembleContributorName({
    nameType: "Personal",
    givenName: user?.firstName ?? undefined,
    familyName: user?.lastName ?? undefined,
  })

  const form = await prisma.markerForm.create({
    data: {
      ownerId: userId,
      familyId: generatePID("mf"),
      origin: "FORKED",
      forkedFromPid: published.pid,
      forkedAt: new Date(),
      versions: {
        create: {
          name: newName,
          version: 1,
          schema: newSchema as Prisma.InputJsonValue,
          uiSchema: uiSchema as Prisma.InputJsonValue,
          // Copied verbatim from the frozen package snapshot — already
          // validated at publish time (publishSchema.ts), same trust
          // domain as cloneFormVersion.ts, unlike a STAPLE import.
          semantics: (semantics ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          versionId: generatePID("mv"),
          // A fresh fork always starts fresh publication metadata (not
          // copied from the source) — same rule as createForm.ts. The
          // publish wizard already re-requires every FAIR field before a
          // re-publish, so nothing is lost.
          publicationMetadata: {
            create: copyPublicationMetadataFields({
              ...DEFAULT_PUBLICATION_METADATA,
              contributors: authorName
                ? [{
                    name: authorName,
                    nameType: "Personal",
                    givenName: user?.firstName ?? undefined,
                    familyName: user?.lastName ?? undefined,
                    roles: [DEFAULT_PUBLICATION_CONTRIBUTOR_ROLE, "Creator"],
                    orcid: user?.orcid ?? "",
                  }]
                : [],
            }),
          },
        },
      },
    },
  })

  // Self-forking is now allowed (see above) — createNotification has no
  // built-in self-notify guard (by design, per its own doc comment: it
  // trusts each caller's already-authorized recipient list), so skip it
  // explicitly rather than tell someone they forked their own schema.
  await createNotification({
    recipients: published.authorId === userId ? [] : [published.authorId],
    kind: "SCHEMA_FORKED",
    data: {
      forkedByUsername: user?.username ?? "Someone",
      originalTitle: published.title || "Untitled Schema",
      originalFormId: published.originFormVersion?.formId ?? null,
      originalPid: published.pid,
    },
  })

  revalidatePath("/collection")
  return form.id
})
