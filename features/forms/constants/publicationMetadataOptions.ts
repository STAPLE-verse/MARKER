import type { SelectOption } from "@/components/ui/Select"
import { LEGACY_LANGUAGE_LABELS, PUBLICATION_LANGUAGE_OPTIONS } from "./publicationLanguages"

/**
 * Research fields from the OECD Fields of Science classification (the revised
 * 2007 "FOS" list: 42 fields in 6 groups), the vocabulary funders and DataCite
 * use. The stored `value` is the OECD code ("5.1"); people only ever see the
 * `label` ("Psychology") and its `group`, the OECD top-level area.
 */
export const PUBLICATION_DOMAIN_OPTIONS = [
  { value: "1.1", label: "Mathematics", group: "Natural sciences" },
  { value: "1.2", label: "Computer and information sciences", group: "Natural sciences" },
  { value: "1.3", label: "Physical sciences", group: "Natural sciences" },
  { value: "1.4", label: "Chemical sciences", group: "Natural sciences" },
  { value: "1.5", label: "Earth and related environmental sciences", group: "Natural sciences" },
  { value: "1.6", label: "Biological sciences", group: "Natural sciences" },
  { value: "1.7", label: "Other natural sciences", group: "Natural sciences" },
  { value: "2.1", label: "Civil engineering", group: "Engineering and technology" },
  { value: "2.2", label: "Electrical, electronic and information engineering", group: "Engineering and technology" },
  { value: "2.3", label: "Mechanical engineering", group: "Engineering and technology" },
  { value: "2.4", label: "Chemical engineering", group: "Engineering and technology" },
  { value: "2.5", label: "Materials engineering", group: "Engineering and technology" },
  { value: "2.6", label: "Medical engineering", group: "Engineering and technology" },
  { value: "2.7", label: "Environmental engineering", group: "Engineering and technology" },
  { value: "2.8", label: "Environmental biotechnology", group: "Engineering and technology" },
  { value: "2.9", label: "Industrial biotechnology", group: "Engineering and technology" },
  { value: "2.10", label: "Nano-technology", group: "Engineering and technology" },
  { value: "2.11", label: "Other engineering and technologies", group: "Engineering and technology" },
  { value: "3.1", label: "Basic medicine", group: "Medical and health sciences" },
  { value: "3.2", label: "Clinical medicine", group: "Medical and health sciences" },
  { value: "3.3", label: "Health sciences", group: "Medical and health sciences" },
  { value: "3.4", label: "Medical biotechnology", group: "Medical and health sciences" },
  { value: "3.5", label: "Other medical sciences", group: "Medical and health sciences" },
  { value: "4.1", label: "Agriculture, forestry and fisheries", group: "Agricultural sciences" },
  { value: "4.2", label: "Animal and dairy science", group: "Agricultural sciences" },
  { value: "4.3", label: "Veterinary science", group: "Agricultural sciences" },
  { value: "4.4", label: "Agricultural biotechnology", group: "Agricultural sciences" },
  { value: "4.5", label: "Other agricultural sciences", group: "Agricultural sciences" },
  { value: "5.1", label: "Psychology", group: "Social sciences" },
  { value: "5.2", label: "Economics and business", group: "Social sciences" },
  { value: "5.3", label: "Educational sciences", group: "Social sciences" },
  { value: "5.4", label: "Sociology", group: "Social sciences" },
  { value: "5.5", label: "Law", group: "Social sciences" },
  { value: "5.6", label: "Political science", group: "Social sciences" },
  { value: "5.7", label: "Social and economic geography", group: "Social sciences" },
  { value: "5.8", label: "Media and communications", group: "Social sciences" },
  { value: "5.9", label: "Other social sciences", group: "Social sciences" },
  { value: "6.1", label: "History and archaeology", group: "Humanities" },
  { value: "6.2", label: "Languages and literature", group: "Humanities" },
  { value: "6.3", label: "Philosophy, ethics and religion", group: "Humanities" },
  { value: "6.4", label: "Arts", group: "Humanities" },
  { value: "6.5", label: "Other humanities", group: "Humanities" },
] satisfies SelectOption[]

/**
 * MARKER's original four domains were stored as words, before the OECD codes
 * were adopted. Three of them are OECD fields and read as their code from now
 * on; `neuroscience` has no OECD field of its own (it falls under "Basic
 * medicine"), so it keeps its stored value and just gets a display label.
 */
const LEGACY_DOMAIN_CODES: Record<string, string> = {
  psychology: "5.1",
  economics: "5.2",
  sociology: "5.4",
}

const LEGACY_DOMAIN_LABELS: Record<string, string> = {
  neuroscience: "Neuroscience",
}

/**
 * Maps a domain stored the old way to its OECD code, leaving anything else
 * untouched. Applied wherever a stored domain is read, so an older schema and
 * a new one in the same field filter and display as the same thing.
 */
export function normalizeDomainValue<T extends string | null | undefined>(value: T): T | string {
  const trimmed = value?.trim()
  return (trimmed && LEGACY_DOMAIN_CODES[trimmed]) || value
}

export { PUBLICATION_LANGUAGE_OPTIONS }

/**
 * Open licenses offered at publication, by SPDX identifier. Deliberately a
 * short curated set rather than the whole SPDX list. Every entry needs a
 * matching URI in `utils/licenses.ts` — that URI is written into the published
 * package (`licenses.test.ts` fails if one is missing).
 */
export const PUBLICATION_LICENSE_OPTIONS = [
  { value: "CC-BY-4.0", label: "Creative Commons Attribution 4.0 (CC-BY-4.0)" },
  { value: "CC0-1.0", label: "CC0 1.0 Universal (Public Domain Dedication)" },
  { value: "CC-BY-SA-4.0", label: "Creative Commons Attribution-ShareAlike 4.0 (CC-BY-SA-4.0)" },
  { value: "CC-BY-NC-4.0", label: "Creative Commons Attribution-NonCommercial 4.0 (CC-BY-NC-4.0)" },
  {
    value: "CC-BY-NC-SA-4.0",
    label: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC-BY-NC-SA-4.0)",
  },
  { value: "CC-BY-ND-4.0", label: "Creative Commons Attribution-NoDerivatives 4.0 (CC-BY-ND-4.0)" },
  { value: "MIT", label: "MIT License" },
  { value: "Apache-2.0", label: "Apache License 2.0" },
  { value: "GPL-3.0-or-later", label: "GNU General Public License v3.0 or later" },
] satisfies SelectOption[]

export const PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS = [
  { value: "Author", label: "Author" },
  { value: "Creator", label: "Creator" },
  { value: "Maintainer", label: "Maintainer" },
  { value: "Translator", label: "Translator" },
  { value: "Data Curator", label: "Data Curator" },
] satisfies SelectOption[]

export function labelForSelectValue(
  value: string | null | undefined,
  options: readonly SelectOption[],
  placeholder = "Not specified"
): string {
  const trimmed = value?.trim()
  if (!trimmed) return placeholder

  return options.find((option) => option.value === trimmed)?.label ?? trimmed
}

export function domainLabel(value: string | null | undefined): string {
  const normalized = normalizeDomainValue(value)
  const legacy = normalized ? LEGACY_DOMAIN_LABELS[normalized.trim()] : undefined
  return legacy ?? labelForSelectValue(normalized, PUBLICATION_DOMAIN_OPTIONS)
}

export function languageLabel(value: string | null | undefined): string {
  const legacy = value ? LEGACY_LANGUAGE_LABELS[value.trim()] : undefined
  return legacy ?? labelForSelectValue(value, PUBLICATION_LANGUAGE_OPTIONS)
}

export function licenseLabel(value: string | null | undefined): string {
  return labelForSelectValue(value, PUBLICATION_LICENSE_OPTIONS)
}

export function contributorRoleLabel(value: string | null | undefined): string {
  return labelForSelectValue(value, PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS)
}
