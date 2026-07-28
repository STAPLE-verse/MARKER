import type { SelectOption } from "@/components/ui/Select"

export const PUBLICATION_DOMAIN_OPTIONS = [
  { value: "psychology", label: "Psychology" },
  { value: "neuroscience", label: "Neuroscience" },
  { value: "economics", label: "Economics" },
  { value: "sociology", label: "Sociology" },
] satisfies SelectOption[]

export const PUBLICATION_LANGUAGE_OPTIONS = [
  { value: "en", label: "English (US)" },
  { value: "en-gb", label: "English (UK)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
] satisfies SelectOption[]

export const PUBLICATION_LICENSE_OPTIONS = [
  { value: "CC-BY 4.0", label: "Creative Commons Attribution 4.0 (CC-BY 4.0)" },
  { value: "CC0 1.0", label: "CC0 1.0 Universal (Public Domain Dedication)" },
  { value: "MIT", label: "MIT License" },
] satisfies SelectOption[]

export const PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS = [
  { value: "Author", label: "Author" },
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
  return labelForSelectValue(value, PUBLICATION_DOMAIN_OPTIONS)
}

export function languageLabel(value: string | null | undefined): string {
  return labelForSelectValue(value, PUBLICATION_LANGUAGE_OPTIONS)
}

export function licenseLabel(value: string | null | undefined): string {
  return labelForSelectValue(value, PUBLICATION_LICENSE_OPTIONS)
}

export function contributorRoleLabel(value: string | null | undefined): string {
  return labelForSelectValue(value, PUBLICATION_CONTRIBUTOR_ROLE_OPTIONS)
}
