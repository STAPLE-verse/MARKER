/**
 * Sanitizes a `next`/`callbackUrl`-style redirect target read from a query
 * string. Only same-origin, path-relative values are allowed — an
 * unvalidated absolute URL (`?next=https://evil.example`) or
 * protocol-relative one (`?next=//evil.example`) would turn a login/signup
 * page into an open redirect, a classic phishing vector.
 *
 * A second leading `/` isn't the only protocol-relative form: WHATWG URL
 * parsing normalizes a leading backslash to a forward slash for special
 * schemes, so `/\evil.example` resolves to `https://evil.example/` in a
 * browser just like `//evil.example` does (verified against `new URL(...)`
 * — this isn't a theoretical edge case). Reject either second character.
 */
export function sanitizeNextPath(value: string | string[] | undefined | null): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !raw.startsWith("/")) return null
  if (raw[1] === "/" || raw[1] === "\\") return null
  return raw
}
