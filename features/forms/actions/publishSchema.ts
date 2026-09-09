"use server";

import { Prisma, VersionStatus } from "@prisma/client";
import { authenticatedAction } from "@/utils/safe-action";
import { ActionError } from "@/utils/action-result";
import { publishSchemaActionSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { generatePID } from "@/utils/id";
import { extractOntologyIds } from "@/utils/schema";
import {
  CONCURRENT_EDIT_MESSAGE,
  parseExpectedUpdatedAt,
  withLockedEditableFormVersionHead,
} from "../queries/formVersionConcurrency";
import {
  contributorsToJson,
  copyPublicationMetadataFields,
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
            const publicationMetadata = normalizePublicationMetadata(input);
            const publicationMetadataFields = copyPublicationMetadataFields(publicationMetadata);
            const resolvedLicense = publicationMetadata.license ?? input.license;
            const resolvedLanguage = publicationMetadata.language ?? input.language;
            // Package-level description — a real wizard field now (see
            // Step3Review.tsx), independent of the form schema's own
            // description shown to people filling out the rendered form.
            const resolvedDescription = input.description;

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
              description: resolvedDescription,
              language: resolvedLanguage,
              domain: publicationMetadata.domain,
              keywords: publicationMetadata.keywords,
              contributors: publicationMetadata.contributors,
              license: resolvedLicense,
              releaseNotes: input.releaseNotes,
            });

            const diagnostics = validateTemplatePackage(draftPackage);
            if (diagnostics.length > 0) {
              throw new ActionError("VALIDATION", formatDiagnosticsForUser(diagnostics));
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

            await tx.publicationMetadata.upsert({
              where: { formVersionId: latestVersion.id },
              create: {
                formVersion: { connect: { id: latestVersion.id } },
                ...publicationMetadataFields,
              },
              update: publicationMetadataFields,
            });

            const created = await tx.publishedSchema.create({
              data: {
                pid,
                title: latestVersion.name || "Untitled Schema",
                description: resolvedDescription,
                schemaJson: latestVersion.schema ?? {},
                uiSchema: latestVersion.uiSchema ?? {},
                source: "native",
                version: input.version,
                familyId,
                license: resolvedLicense,
                releaseNotes: input.releaseNotes,
                relatedPublicationDoi: input.relatedPublicationDoi,
                keywords: publicationMetadata.keywords,
                domain: publicationMetadata.domain,
                language: resolvedLanguage,
                ontologyRefs: extractOntologyIds(latestVersion.schema),
                authorId: userId,
                contributors: contributorsToJson(publicationMetadata.contributors),
                originFormVersionId: latestVersion.id,
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

        revalidatePath(`/collection/${input.formId}`);
        return { success: true, pid: publishedSchema.pid };
      } catch (error) {
        if (error instanceof ActionError) {
          throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = JSON.stringify(error.meta?.target ?? "");
          if (target.includes("familyId") || target.includes("version")) {
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
