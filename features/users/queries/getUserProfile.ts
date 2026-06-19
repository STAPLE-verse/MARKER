import { prisma } from "@/lib/db";

export type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  orcid: string | null;
};

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      orcid: true,
    },
  });
}
