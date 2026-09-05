"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/utils/safe-action";
import { generatePID } from "@/utils/id";
import { formIdActionSchema } from "../schemas";
import { withLockedAuthorizedLatestVersion } from "../queries/formVersionConcurrency";
import { copyPublicationMetadataFields, DEFAULT_PUBLICATION_METADATA } from "../utils/publicationMetadata";

/**
 * Creates a new FormVersion copied from the latest non-archived head, then
 * intended for immediate editing (architecture.md §8.11.2 rule 9).
 */
export const createFormVersionFromLatest = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }) => {
    const newVersion = await withLockedAuthorizedLatestVersion(
      input.formId,
      userId,
      async (tx, { latestVersion }) => {
        const latestMetadata = await tx.publicationMetadata.findUnique({
          where: { formVersionId: latestVersion.id },
        });

        return tx.markerFormVersion.create({
          data: {
            formId: input.formId,
            version: latestVersion.version + 1,
            name: latestVersion.name,
            schema: latestVersion.schema ?? {},
            uiSchema: latestVersion.uiSchema ?? {},
            semantics: latestVersion.semantics ?? Prisma.JsonNull,
            // New MarkerFormVersion row under the same, existing MarkerForm —
            // mint a fresh versionId; familyId is untouched.
            versionId: generatePID("mv"),
            publicationMetadata: {
              create: copyPublicationMetadataFields(latestMetadata ?? DEFAULT_PUBLICATION_METADATA),
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
