"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { cloneFormVersionSchema } from "../schemas"
import { copyPublicationMetadataFields, DEFAULT_PUBLICATION_METADATA } from "../utils/publicationMetadata"

export const cloneFormVersion = authenticatedAction(cloneFormVersionSchema, async ({ input, userId }) => {
  const version = await prisma.markerFormVersion.findUnique({
    where: { id: input.versionId },
    include: {
      form: true,
      publicationMetadata: true,
    }
  });

  if (!version) {
    throw new ActionError("NOT_FOUND", "Form version not found");
  }

  if (version.form.ownerId !== userId) {
    throw new ActionError("FORBIDDEN", "You do not have permission to clone this form");
  }

  const newName = `Copy of ${version.name || "Untitled Form"}`;

  // If the schema is an object with a title, rename it to match the new copy
  let newSchema = version.schema;
  if (newSchema && typeof newSchema === "object") {
    newSchema = { ...(newSchema as Record<string, unknown>), title: newName };
  }

  // A nested create is atomic: the new MarkerForm and its initial MarkerFormVersion persist together
  const newForm = await prisma.markerForm.create({
    data: {
      ownerId: userId,
      versions: {
        create: {
          name: newName,
          version: 1,
          schema: newSchema ?? {},
          uiSchema: version.uiSchema ?? {},
          publicationMetadata: {
            create: copyPublicationMetadataFields(version.publicationMetadata ?? DEFAULT_PUBLICATION_METADATA),
          },
        }
      }
    }
  });

  revalidatePath("/collection")
  return newForm.id
})
