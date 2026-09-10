"use server"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { ActionError } from "@/utils/action-result"
import { generatePID } from "@/utils/id"
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

  // Cloning creates a genuinely independent new MarkerForm (own lifecycle, own
  // future editing/publishing history — not a continuation of the source's).
  // Starting from a copy of something never inherits its identity, so this
  // mints a fresh familyId/versionId rather than copying the source's forward —
  // the same rule STAPLE's own "start from a default template" flow already
  // follows by discarding the source package's identity entirely.
  //
  // A nested create is atomic: the new MarkerForm and its initial MarkerFormVersion persist together
  const newForm = await prisma.markerForm.create({
    data: {
      ownerId: userId,
      familyId: generatePID("mf"),
      versions: {
        create: {
          name: newName,
          version: 1,
          schema: newSchema ?? {},
          uiSchema: version.uiSchema ?? {},
          // Duplicated content, not identity: copy the source's semantics
          // verbatim (already valid — it was authored and validated through
          // MARKER's own editor).
          semantics: version.semantics ?? Prisma.JsonNull,
          versionId: generatePID("mv"),
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
