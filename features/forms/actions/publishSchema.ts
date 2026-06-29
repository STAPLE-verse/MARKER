"use server";

import { Prisma, VersionStatus } from "@prisma/client";
import { authenticatedAction } from "@/utils/safe-action";
import { ActionError } from "@/utils/action-result";
import { publishSchemaActionSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { generatePID } from "@/utils/id";
import { extractOntologyIds, extractSchemaDescription } from "@/utils/schema";
import {
  CONCURRENT_EDIT_MESSAGE,
  parseExpectedUpdatedAt,
  withLockedEditableFormVersionHead,
} from "../queries/formVersionConcurrency";
import { copyMetadataFields, normalizeCatalogMetadata } from "../utils/catalogMetadata";

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
            const familyId = `family_${form.id}`;
            const catalogMetadata = normalizeCatalogMetadata(input);
            const publicationMetadataFields = copyMetadataFields(catalogMetadata);
            const locked = await tx.formVersion.updateMany({
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

            return tx.publishedSchema.create({
              data: {
                pid,
                title: latestVersion.name || "Untitled Schema",
                description: extractSchemaDescription(latestVersion.schema),
                schemaJson: latestVersion.schema ?? {},
                uiSchema: latestVersion.uiSchema ?? {},
                source: "native",
                version: input.version,
                familyId,
                license: catalogMetadata.license ?? input.license,
                releaseNotes: input.releaseNotes,
                relatedPublicationDoi: input.relatedPublicationDoi,
                keywords: catalogMetadata.keywords,
                domain: catalogMetadata.domain,
                language: catalogMetadata.language ?? input.language,
                ontologyRefs: extractOntologyIds(latestVersion.schema),
                authorId: userId,
                contributors: catalogMetadata.contributors.map((c) => ({
                  name: c.name,
                  role: c.role,
                  orcid: c.orcid || null,
                })),
                originFormVersionId: latestVersion.id,
              },
            });
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
