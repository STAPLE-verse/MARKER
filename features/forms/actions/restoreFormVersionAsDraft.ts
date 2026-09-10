"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/utils/safe-action";
import { ActionError } from "@/utils/action-result";
import { generatePID } from "@/utils/id";
import { restoreFormVersionAsDraftSchema } from "../schemas";
import { withLockedAuthorizedLatestVersion } from "../queries/formVersionConcurrency";
import { copyPublicationMetadataFields, DEFAULT_PUBLICATION_METADATA } from "../utils/publicationMetadata";

/**
 * Restores a historical version without rewriting history by copying it into a
 * new draft head on the same form.
 */
export const restoreFormVersionAsDraft = authenticatedAction(
  restoreFormVersionAsDraftSchema,
  async ({ input, userId }) => {
    const newVersion = await withLockedAuthorizedLatestVersion(
      input.formId,
      userId,
      async (tx, { latestVersion }) => {
        if (latestVersion.id === input.versionId) {
          throw new ActionError("CONFLICT", "This is already the latest version.");
        }

        const sourceVersion = await tx.markerFormVersion.findUnique({
          where: { id: input.versionId },
          include: {
            publicationMetadata: true,
          },
        });

        if (
          !sourceVersion ||
          sourceVersion.formId !== input.formId ||
          sourceVersion.archived ||
          sourceVersion.status === "ARCHIVED"
        ) {
          throw new ActionError("NOT_FOUND", "Form version not found");
        }

        return tx.markerFormVersion.create({
          data: {
            formId: input.formId,
            version: latestVersion.version + 1,
            name: sourceVersion.name,
            schema: sourceVersion.schema ?? {},
            uiSchema: sourceVersion.uiSchema ?? {},
            semantics: sourceVersion.semantics ?? Prisma.JsonNull,
            // New MarkerFormVersion row under the same, existing MarkerForm —
            // mint a fresh versionId; familyId is untouched.
            versionId: generatePID("mv"),
            // The restored content's own provenance travels with it — not
            // the (possibly different) provenance of whatever version this
            // is replacing as head. Restoring v1 (imported from STAPLE v3)
            // as a new v5 means v5 truly is "STAPLE v3, as of that import,"
            // regardless of what happened on v2-v4 in between.
            importedFromStapleVersionNumber: sourceVersion.importedFromStapleVersionNumber,
            importedAt: sourceVersion.importedAt,
            originalImportHash: sourceVersion.originalImportHash,
            publicationMetadata: {
              create: copyPublicationMetadataFields(
                sourceVersion.publicationMetadata ?? DEFAULT_PUBLICATION_METADATA
              ),
            },
          },
        });
      }
    );

    revalidatePath(`/collection/${input.formId}`);
    revalidatePath(`/collection/${input.formId}/edit`);
    revalidatePath("/collection");

    return { version: newVersion.version };
  }
);
