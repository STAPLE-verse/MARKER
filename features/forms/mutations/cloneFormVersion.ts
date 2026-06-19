"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { authenticatedAction } from "@/utils/safe-action"
import { z } from "zod"

const cloneFormVersionSchema = z.object({
  versionId: z.number(),
})

export const cloneFormVersion = authenticatedAction(cloneFormVersionSchema, async ({ input, userId }) => {
  const version = await prisma.formVersion.findUnique({
    where: { id: input.versionId },
    include: { form: true }
  });

  if (!version) {
    throw new Error("Form version not found");
  }

  if (version.form.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const newName = `Copy of ${version.name || "Untitled Form"}`;

  // If schema is an object and has a title, update it too
  let newSchema = version.schema;
  if (newSchema && typeof newSchema === 'object') {
    newSchema = { ...(newSchema as any), title: newName };
  }

  // Create new Form and initial FormVersion in a transaction
  const newForm = await prisma.form.create({
    data: {
      app: "marker",
      userId,
      versions: {
        create: {
          name: newName,
          version: 1,
          schema: newSchema || {},
          uiSchema: version.uiSchema || {}
        }
      }
    }
  });

  revalidatePath("/collection")
  return newForm.id
})
