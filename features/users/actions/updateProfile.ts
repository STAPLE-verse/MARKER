"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ActionError } from "@/utils/action-result";
import { authenticatedAction } from "@/utils/safe-action";
import { updateProfileSchema } from "../schemas";

/** Blank text fields are stored as `null`, matching how the profile view already renders "Not set". */
const emptyToNull = (value: string) => (value.length > 0 ? value : null);

export const updateProfile = authenticatedAction(updateProfileSchema, async ({ input, userId }) => {
  // `username`/`email` are `@unique` in the DB — check for a conflict up
  // front so it lands as an inline field error, not a raw constraint
  // violation (the gap in STAPLE's own `updateUser` mutation, which has no
  // conflict handling at all and would otherwise let two accounts collide
  // on the same email — a real privacy risk since email is also the login
  // identity). Still wrapped in a catch below for the race between this
  // check and the write itself.
  const [usernameTaken, emailTaken] = await Promise.all([
    prisma.user.findFirst({ where: { username: input.username, NOT: { id: userId } }, select: { id: true } }),
    prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } }, select: { id: true } }),
  ]);

  const issues: z.core.$ZodIssue[] = [];
  if (usernameTaken) {
    issues.push({ code: "custom", path: ["username"], message: "This username is already taken.", input: input.username });
  }
  if (emailTaken) {
    issues.push({ code: "custom", path: ["email"], message: "This email is already in use.", input: input.email });
  }
  if (issues.length > 0) {
    throw new z.ZodError(issues);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username: input.username,
        email: input.email,
        firstName: emptyToNull(input.firstName),
        lastName: emptyToNull(input.lastName),
        institution: emptyToNull(input.institution),
        orcid: emptyToNull(input.orcid),
        gravatar: emptyToNull(input.gravatar),
        language: input.language,
        theme: input.theme,
      },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        institution: true,
        orcid: true,
        gravatar: true,
        language: true,
        theme: true,
      },
    });

    revalidatePath("/profile");

    return updated;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Someone else grabbed the same username/email between the check
      // above and this write — rare, but the DB is the final authority.
      throw new ActionError("CONFLICT", "That username or email was just taken by someone else. Please try again.");
    }
    throw error;
  }
});
