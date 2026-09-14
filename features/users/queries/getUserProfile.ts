import { prisma } from "@/lib/db";

export type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  orcid: string | null;
  institution: string | null;
  gravatar: string | null;
  language: string;
};

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      orcid: true,
      institution: true,
      gravatar: true,
      language: true,
    },
  });
}
