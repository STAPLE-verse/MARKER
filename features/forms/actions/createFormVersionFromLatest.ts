"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/utils/safe-action";
import { formIdActionSchema } from "../schemas";
import { getAuthorizedLatestVersion } from "../queries/getAuthorizedLatestVersion";

/**
 * Creates a new FormVersion copied from the latest non-archived head, then
 * intended for immediate editing (architecture.md §8.11.2 rule 9).
 */
export const createFormVersionFromLatest = authenticatedAction(
  formIdActionSchema,
  async ({ input, userId }) => {
    const { latestVersion } = await getAuthorizedLatestVersion(input.formId, userId);

    const newVersion = await prisma.formVersion.create({
      data: {
        formId: input.formId,
        version: latestVersion.version + 1,
        name: latestVersion.name,
        schema: latestVersion.schema ?? {},
        uiSchema: latestVersion.uiSchema ?? {},
      },
    });

    revalidatePath(`/collection/${input.formId}`);
    revalidatePath(`/collection/${input.formId}/edit`);
    revalidatePath("/collection");

    return { version: newVersion.version };
  }
);
