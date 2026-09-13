"use server";

import { Prisma, VersionStatus } from "@prisma/client";
import { authenticatedAction } from "@/utils/safe-action";
import { ActionError } from "@/utils/action-result";
import { publishSchemaActionSchema, strictPublicationMetadataSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { generatePID } from "@/utils/id";
import { extractOntologyIds } from "@/utils/schema";
import { createNotification } from "@/features/notifications/actions/createNotification";
import { prisma } from "@/lib/db";
import {
  CONCURRENT_EDIT_MESSAGE,
  parseExpectedUpdatedAt,
  withLockedEditableFormVersionHead,
} from "../queries/formVersionConcurrency";
import {
  contributorsToJson,
  normalizePublicationMetadata,
} from "../utils/publicationMetadata";
import { assemblePublishedPackage, formatDiagnosticsForUser, validateTemplatePackage } from "../utils/templatePackage";

const MAX_PID_ATTEMPTS = 5;

export const publishSchema = authenticatedAction(
  publishSchemaActionSchema,
  async ({ input, userId }) => {
    const expectedUpdatedAt = parseExpectedUpdatedAt(input.expectedUpdatedAt);

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_PID_ATTEMPTS; attempt++) {
      const pid = generatePID("ps");
      try {
        const publishedSchema = await withLockedEditableFormVersionHead(
          input.formId,
          userId,
          input.formVersionId,
          expectedUpdatedAt,
          async (tx, { form, latestVersion }) => {
            // marker-template-spec Core V1 metadata.familyId — the real, stored
            // identity minted once at MarkerForm creation (see templateIdentity.ts).
            const familyId = form.familyId;

            // PublicationMetadata now has exactly one writer —
            // `savePublicationMetadata`, which both the draft card and the
            // wizard's Steps 1-2 "Continue" go through (see
            // PublishSchemaClient.tsx). Publish only reads the row here;
            // re-validated against the strict schema since the DB row itself
            // (unlike the old wizard-submitted input) was never guaranteed
            // to satisfy publish-time requiredness.
            const publicationMetadataRow = await tx.publicationMetadata.findUnique({
              where: { formVersionId: latestVersion.id },
            });
            const parsedMetadata = strictPublicationMetadataSchema.safeParse(
              normalizePublicationMetadata(publicationMetadataRow)
            );
            if (!parsedMetadata.success) {
              throw new ActionError(
                "VALIDATION",
                "Publication metadata is incomplete. Go back to the FAIR Metadata and Contributors steps and fill in the required fields before publishing."
              );
            }
            const publicationMetadata = parsedMetadata.data;
            // Package-level description — a real wizard field now (see
            // Step3Review.tsx), independent of the form schema's own
            // description shown to people filling out the rendered form.
            const packageDescription = input.description;

            const draftPackage = assemblePublishedPackage({
              pid,
              familyId,
              version: input.version,
              title: latestVersion.name || "Untitled Schema",
              schema: (latestVersion.schema ?? {}) as Record<string, unknown>,
              uiSchema: latestVersion.uiSchema as Record<string, unknown> | null,
              semantics: latestVersion.semantics,
              createdAt: latestVersion.createdAt,
              updatedAt: latestVersion.updatedAt,
              publishedAt: new Date(),
              description: packageDescription,
              language: publicationMetadata.language,
              domain: publicationMetadata.domain,
              keywords: publicationMetadata.keywords,
              contributors: publicationMetadata.contributors,
              license: publicationMetadata.license,
              releaseNotes: input.releaseNotes,
            });

            const diagnostics = validateTemplatePackage(draftPackage);
            if (diagnostics.length > 0) {
              // Should be unreachable in normal use: Phase 3a already gates
              // schema/uiSchema conformance before the wizard opens, and every
              // metadata field here is zod-validated at save time (Steps 1-2
              // "Continue", Step 3 submit — see Phase 2). Reaching this means
              // something upstream has a gap (a spec rule zod doesn't mirror, a
              // race with a concurrent edit, a stale pre-Phase-1 row) rather
              // than a mistake the user can fix by re-typing a field, so it's
              // logged here for maintainer follow-up rather than mapped to a
              // specific input (docs/refactor/publish-wizard-refactor.md,
              // Phase 3b — field mapping was considered and deliberately cut).
              console.error(
                "publishSchema: assembled package failed marker-template-spec validation despite passing all upstream checks",
                { formId: input.formId, formVersionId: input.formVersionId, diagnostics }
              );
              throw new ActionError(
                "VALIDATION",
                `This didn't meet publishing requirements even though it passed the earlier checks (${formatDiagnosticsForUser(diagnostics)}). Re-check your schema in the editor and your publication details, then try publishing again. If this keeps happening, contact support.`
              );
            }

            const locked = await tx.markerFormVersion.updateMany({
              where: {
                id: input.formVersionId,
                formId: input.formId,
                updatedAt: expectedUpdatedAt,
                archived: false,
                status: VersionStatus.DRAFT,
              },
              data: { status: VersionStatus.PUBLISHED },
            });

            if (locked.count === 0) {
              throw new ActionError("CONFLICT", CONCURRENT_EDIT_MESSAGE);
            }

            const created = await tx.publishedSchema.create({
              data: {
                pid,
                title: latestVersion.name || "Untitled Schema",
                description: packageDescription,
                schemaJson: latestVersion.schema ?? {},
                uiSchema: latestVersion.uiSchema ?? {},
                source: "native",
                version: input.version,
                familyId,
                license: publicationMetadata.license,
                releaseNotes: input.releaseNotes,
                relatedPublicationDoi: input.relatedPublicationDoi,
                keywords: publicationMetadata.keywords,
                domain: publicationMetadata.domain,
                language: publicationMetadata.language,
                ontologyRefs: extractOntologyIds(latestVersion.schema),
                authorId: userId,
                contributors: contributorsToJson(publicationMetadata.contributors),
                originFormVersionId: latestVersion.id,
                // Academic-credit lineage (architecture.md "Tracking Lineage
                // (Forking)") — carried forward automatically, no user input:
                // `form` already has every MarkerForm scalar column in scope
                // (getAuthorizedLatestVersion's findUnique has no `select`),
                // so this costs no extra query. Applies on every republish
                // from a forked-origin form, not just the first — there's no
                // "did they actually modify it" gate here (that's the
                // separate, unbuilt modification-status system).
                derivedFromPid: form.origin === "FORKED" ? form.forkedFromPid : null,
              },
            });

            // Freeze the already-assembled, already-validated package as a
            // permanent snapshot — see PublishedSchemaPackage's own comment
            // in schema.prisma for why this isn't re-derived from `created`
            // on read.
            await tx.publishedSchemaPackage.create({
              data: {
                pid,
                packageJson: draftPackage as unknown as Prisma.InputJsonValue,
              },
            });

            return created;
          }
        );

        // Fires only after the transaction above has committed — never
        // inside it, since `createNotification` writes through the plain
        // `prisma` client, not `tx`, and would otherwise survive a rollback
        // of the publish it's supposedly announcing.
        const publisher = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        const publisherUsername = publisher?.username ?? "Someone";

        // 1. This publish is itself a fork of someone else's schema — tell
        //    the original author their work was built on.
        if (publishedSchema.derivedFromPid) {
          const originalSchema = await prisma.publishedSchema.findUnique({
            where: { pid: publishedSchema.derivedFromPid },
            select: { authorId: true },
          });

          if (originalSchema && originalSchema.authorId !== userId) {
            await createNotification({
              recipients: [originalSchema.authorId],
              kind: "SCHEMA_FORK_PUBLISHED",
              data: {
                publisherUsername,
                forkedTitle: publishedSchema.title,
                version: publishedSchema.version,
                forkedPid: publishedSchema.pid,
              },
            });
          }
        }

        // 2. This family (any of its versions) has been forked before — tell
        //    those forkers a new version just landed. `forkedFromPid` is a
        //    bare string, not a Prisma relation (same reasoning as
        //    `getFormById.ts`'s `forkedFrom` lookup), so this is a second
        //    query rather than an `include`.
        const familyVersionPids = await prisma.publishedSchema.findMany({
          where: { familyId: publishedSchema.familyId },
          select: { pid: true },
        });
        const forkers = await prisma.markerForm.findMany({
          where: {
            forkedFromPid: { in: familyVersionPids.map((v) => v.pid) },
            ownerId: { not: userId },
          },
          select: { ownerId: true },
          distinct: ["ownerId"],
        });

        if (forkers.length > 0) {
          await createNotification({
            recipients: forkers.map((f) => f.ownerId),
            kind: "FORKED_SCHEMA_UPDATED",
            data: {
              publisherUsername,
              originalTitle: publishedSchema.title,
              version: publishedSchema.version,
              originalPid: publishedSchema.pid,
            },
          });
        }

        revalidatePath(`/collection/${input.formId}`);
        return { success: true, pid: publishedSchema.pid };
      } catch (error) {
        if (error instanceof ActionError) {
          throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // `error.meta.target` — the documented way to see which fields a
          // P2002 violated — is NOT populated under `@prisma/adapter-pg`
          // (this project's driver, see lib/db.ts): the field names only
          // show up in `error.message` ('Unique constraint failed on the
          // fields: (`"familyId"`, `version`)') and in an undocumented
          // nested path (`meta.driverAdapterError.cause.constraint.fields`)
          // that isn't part of Prisma's stable API. Verified directly
          // against this project's real DB, not assumed. Checking `target`
          // alone silently missed every real familyId+version conflict,
          // falling through to the PID-retry loop below and eventually
          // surfacing "Failed to generate a unique PID" instead of this
          // actionable message — so check `message` too.
          const target = JSON.stringify(error.meta?.target ?? "");
          if (
            target.includes("familyId") ||
            target.includes("version") ||
            error.message.includes("familyId") ||
            error.message.includes("version")
          ) {
            throw new ActionError(
              "CONFLICT",
              `Version ${input.version} has already been published for this schema. Please choose a higher version number.`
            );
          }
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    console.error("PID generation exhausted attempts", lastError);
    throw new ActionError("UNKNOWN", "Failed to generate a unique PID for the schema. Please try again.");
  }
);
