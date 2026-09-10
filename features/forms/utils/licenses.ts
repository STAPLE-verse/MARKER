/**
 * Maps MARKER's stored `license` identifier (SPDX-style, e.g. "CC-BY-4.0") to
 * its canonical URI for marker-template-spec's `metadata.license.uri`. Fully
 * derivable from the existing `license` column, so it's computed here rather
 * than stored as a second column.
 */
const LICENSE_URIS: Record<string, string> = {
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  MIT: "https://opensource.org/license/mit/",
}

export function licenseUriFor(license: string): string | undefined {
  return LICENSE_URIS[license.trim()]
}
