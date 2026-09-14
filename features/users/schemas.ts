import { z } from "zod";
import type { SelectOption } from "@/components/ui/Select";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const PROFILE_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "hu-HU", label: "Hungarian (Magyar)" },
];

const PROFILE_LANGUAGE_VALUES = PROFILE_LANGUAGE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

// Format-only (not the ISO 7064 mod-11-2 checksum), same rule MARKER already
// applies to publication contributors (features/forms/schemas.ts) — kept as
// its own copy here since the two features validate unrelated data and
// aren't meant to share code across the feature boundary (docs/architecture.md §8.8).
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const optionalProfileText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

export const updateProfileSchema = z.object({
  firstName: optionalProfileText(100, "First name"),
  lastName: optionalProfileText(100, "Last name"),
  institution: optionalProfileText(200, "Institution"),
  orcid: z
    .string()
    .trim()
    .refine((value) => !value || ORCID_PATTERN.test(value), {
      message: "Must be a valid ORCID (e.g. 0000-0002-1825-0097)",
    }),
  language: z.enum(PROFILE_LANGUAGE_VALUES),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
