import { cache } from "react";
import { prisma } from "@/lib/db";

export type UserProfile = {
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  orcid: string | null;
  institution: string | null;
  gravatar: string | null;
  language: string;
  theme: string;
};

// `cache()`-wrapped: the root layout (for `data-theme`) and `AppNavbar` (for
// gravatar/username) both call this on every request, and without this
// they'd otherwise run the same query twice per page load.
export const getUserProfile = cache(async (userId: number): Promise<UserProfile | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      orcid: true,
      institution: true,
      gravatar: true,
      language: true,
      theme: true,
    },
  });
});
