"use server";

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/utils/safe-action";
import { ActionError } from "@/utils/action-result";
import { deleteFormVersionSchema } from "../schemas";
import { withLockedAuthorizedLatestVersion } from "../queries/formVersionConcurrency";
import { nonArchivedVersionFilter } from "../queries/versionSelectors";

/**
 * Hard-deletes a single draft version. Published versions and the sole remaining
 * version on a form are rejected — see docs/form-delete-policy.md.
 */
export const deleteFormVersion = authenticatedAction(
  deleteFormVersionSchema,
  async ({ input, userId }) => {
    await withLockedAuthorizedLatestVersion(input.formId, userId, async (tx) => {
      const targetVersion = await tx.markerFormVersion.findUnique({
        where: { id: input.versionId },
      });

      if (
        !targetVersion ||
        targetVersion.formId !== input.formId ||
        targetVersion.archived
      ) {
        throw new ActionError("NOT_FOUND", "Form version not found");
      }

      if (targetVersion.status !== "DRAFT") {
        throw new ActionError("CONFLICT", "Only draft versions can be deleted.");
      }

      const activeVersionCount = await tx.markerFormVersion.count({
        where: {
          formId: input.formId,
          ...nonArchivedVersionFilter,
        },
      });

      if (activeVersionCount <= 1) {
        throw new ActionError(
          "CONFLICT",
          "Cannot delete the only remaining version. Delete the form instead."
        );
      }

      await tx.markerFormVersion.delete({
        where: { id: input.versionId },
      });
    });

    revalidatePath(`/collection/${input.formId}`);
    revalidatePath(`/collection/${input.formId}/edit`);
    revalidatePath("/collection");

    return { success: true };
  }
);
