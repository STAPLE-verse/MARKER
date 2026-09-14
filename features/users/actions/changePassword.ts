"use server";

import { prisma } from "@/lib/db";
import { PasswordVerifyResult, SecurePassword } from "@/lib/hash";
import { ActionError } from "@/utils/action-result";
import { authenticatedAction } from "@/utils/safe-action";
import { changePasswordSchema } from "../schemas";

/**
 * Verifies the caller's current password before writing a fresh hash for the
 * new one (see lib/hash.ts for the STAPLE-compatible hash format).
 */
export const changePassword = authenticatedAction(changePasswordSchema, async ({ input, userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    throw new ActionError("FORBIDDEN", "Password changes aren't available for this account.");
  }

  const result = await SecurePassword.verify(input.currentPassword, user.hashedPassword);
  if (result === PasswordVerifyResult.INVALID) {
    throw new ActionError("FORBIDDEN", "Current password is incorrect.");
  }

  const hashedPassword = await SecurePassword.hash(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword },
  });

  return { success: true };
});
