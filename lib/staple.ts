/**
 * Links into STAPLE. MARKER has no accounts of its own — sign-up, the terms
 * of use, and password reset all live in STAPLE, so MARKER sends people there
 * rather than duplicating (and drifting from) those flows.
 */
export const STAPLE_URL = (process.env.NEXT_PUBLIC_STAPLE_URL || "https://app.staplescience.com").replace(/\/+$/, "");

export const STAPLE_FORGOT_PASSWORD_URL = `${STAPLE_URL}/auth/forgot-password`;

/**
 * STAPLE's sign-up page, flagged so STAPLE sends the new user back to
 * MARKER's login once they've accepted the terms. `next` is the (already
 * sanitized) MARKER path to land on after that login; STAPLE re-validates it
 * and only ever redirects to its own configured MARKER address.
 */
export function stapleSignupUrl(next?: string | null): string {
  const params = new URLSearchParams({ from: "marker" });
  if (next) params.set("next", next);
  return `${STAPLE_URL}/auth/signup?${params.toString()}`;
}
