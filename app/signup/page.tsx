import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/utils/redirect";
import { stapleSignupUrl } from "@/lib/staple";

/**
 * MARKER has no sign-up of its own: accounts are STAPLE's, and creating one
 * there is what records acceptance of the terms of use and sets the account
 * up properly. This route only survives so existing `/signup` links keep
 * working.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  redirect(stapleSignupUrl(sanitizeNextPath(next)));
}
