"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/utils/safe-action";
import { updateProfileSchema } from "../schemas";

/** Blank text fields are stored as `null`, matching how the profile view already renders "Not set". */
const emptyToNull = (value: string) => (value.length > 0 ? value : null);

export const updateProfile = authenticatedAction(updateProfileSchema, async ({ input, userId }) => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: emptyToNull(input.firstName),
      lastName: emptyToNull(input.lastName),
      institution: emptyToNull(input.institution),
      orcid: emptyToNull(input.orcid),
      gravatar: emptyToNull(input.gravatar),
      language: input.language,
    },
    select: {
      firstName: true,
      lastName: true,
      institution: true,
      orcid: true,
      gravatar: true,
      language: true,
    },
  });

  revalidatePath("/profile");

  return updated;
});
