"use server"

import { VersionStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { savePublicationMetadataSchema } from "../schemas"
import { withLockedAuthorizedLatestVersion } from "../queries/formVersionConcurrency"
import { copyPublicationMetadataFields, normalizePublicationMetadata } from "../utils/publicationMetadata"

const CONCURRENT_METADATA_EDIT_MESSAGE =
  "This publication metadata was updated in another window. Reload the page to see the latest changes."

const publicationMetadataSelect = {
  updatedAt: true,
  domain: true,
  language: true,
  license: true,
  keywords: true,
  contributors: true,
} as const

export const savePublicationMetadata = authenticatedAction(
  savePublicationMetadataSchema,
  async ({ input, userId }) => {
    const saved = await withLockedAuthorizedLatestVersion(
      input.formId,
      userId,
      async (tx, { latestVersion }) => {
        if (latestVersion.id !== input.formVersionId) {
          throw new ActionError(
            "CONFLICT",
            "This form has a newer draft. Reload the page to continue."
          )
        }

        if (latestVersion.status !== VersionStatus.DRAFT) {
          throw new ActionError(
            "CONFLICT",
            "Cannot edit publication metadata for a published form version."
          )
        }

        const existing = await tx.publicationMetadata.findUnique({
          where: { formVersionId: input.formVersionId },
          select: { id: true, updatedAt: true },
        })
        const metadataFields = copyPublicationMetadataFields(input)

        if (!existing) {
          return tx.publicationMetadata.create({
            data: {
              formVersion: { connect: { id: input.formVersionId } },
              ...metadataFields,
            },
            select: publicationMetadataSelect,
          })
        }

        if (!input.expectedMetadataUpdatedAt) {
          throw new ActionError("CONFLICT", CONCURRENT_METADATA_EDIT_MESSAGE)
        }

        const expectedUpdatedAt = new Date(input.expectedMetadataUpdatedAt)
        if (Number.isNaN(expectedUpdatedAt.getTime())) {
          throw new ActionError("VALIDATION", "Invalid metadata timestamp.")
        }

        const result = await tx.publicationMetadata.updateMany({
          where: {
            id: existing.id,
            updatedAt: expectedUpdatedAt,
          },
          data: metadataFields,
        })

        if (result.count === 0) {
          throw new ActionError("CONFLICT", CONCURRENT_METADATA_EDIT_MESSAGE)
        }

        return tx.publicationMetadata.findUniqueOrThrow({
          where: { id: existing.id },
          select: publicationMetadataSelect,
        })
      }
    )

    revalidatePath(`/collection/${input.formId}`)
    revalidatePath(`/collection/${input.formId}/publish`)

    return {
      updatedAt: saved.updatedAt.toISOString(),
      metadata: normalizePublicationMetadata(saved),
    }
  }
)
