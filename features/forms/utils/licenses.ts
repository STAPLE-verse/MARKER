/**
 * Maps MARKER's stored `license` identifier (SPDX-style, e.g. "CC-BY-4.0") to
 * its canonical URI for marker-template-spec's `metadata.license.uri`. Fully
 * derivable from the existing `license` column, so it's computed here rather
 * than stored as a second column.
 */
const LICENSE_URIS: Record<string, string> = {
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC-BY-SA-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC-BY-NC-4.0": "https://creativecommons.org/licenses/by-nc/4.0/",
  "CC-BY-NC-SA-4.0": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "CC-BY-ND-4.0": "https://creativecommons.org/licenses/by-nd/4.0/",
  MIT: "https://opensource.org/license/mit/",
  "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
  "GPL-3.0-or-later": "https://www.gnu.org/licenses/gpl-3.0.html",
}

export function licenseUriFor(license: string): string | undefined {
  return LICENSE_URIS[license.trim()]
}
