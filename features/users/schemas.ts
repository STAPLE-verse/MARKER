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

// Same catalog STAPLE's ThemeSelect offers, kept in sync with the `themes:`
// list declared in app/globals.css's `@plugin "daisyui"` — a theme picked
// here only actually renders if it's also compiled into that stylesheet.
export const PROFILE_THEME_OPTIONS: SelectOption[] = [
  { value: "light", label: "☼ Light" },
  { value: "dark", label: "☾ Dark" },
  { value: "retro", label: "🪩 Retro" },
  { value: "dracula", label: "🧛🏽 Dracula" },
  { value: "cyberpunk", label: "🤖 Cyberpunk" },
  { value: "cupcake", label: "🧁 Cupcake" },
  { value: "bumblebee", label: "🐝 Bumblebee" },
  { value: "emerald", label: "💚 Emerald" },
  { value: "corporate", label: "👔 Corporate" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "garden", label: "🌿 Garden" },
  { value: "forest", label: "🌲 Forest" },
  { value: "aqua", label: "🐠 Aqua" },
  { value: "lofi", label: "😎 Lofi" },
  { value: "pastel", label: "🌸 Pastel" },
  { value: "fantasy", label: "🐉 Fantasy" },
  { value: "wireframe", label: "🖼️ Wireframe" },
  { value: "black", label: "◼️ Black" },
  { value: "luxury", label: "💰 Luxury" },
  { value: "cmyk", label: "🎨 CMYK" },
  { value: "autumn", label: "🍁 Autumn" },
  { value: "business", label: "💼 Business" },
  { value: "acid", label: "🏜️ Acid" },
  { value: "lemonade", label: "🍋 Lemonade" },
  { value: "night", label: "🌃 Night" },
  { value: "coffee", label: "☕ Coffee" },
  { value: "winter", label: "❄️ Winter" },
  { value: "dim", label: "🔅 Dim" },
  { value: "nord", label: "🐺 Nord" },
  { value: "sunset", label: "🌇 Sunset" },
];

const PROFILE_THEME_VALUES = PROFILE_THEME_OPTIONS.map((option) => option.value) as [string, ...string[]];

// Format-only (not the ISO 7064 mod-11-2 checksum), same rule MARKER already
// applies to publication contributors (features/forms/schemas.ts) — kept as
// its own copy here since the two features validate unrelated data and
// aren't meant to share code across the feature boundary (docs/architecture.md §8.8).
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const optionalProfileText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

export const updateProfileSchema = z.object({
  // `@unique` in the DB (see prisma/schema.prisma) even though it's purely a
  // display name — MARKER never authenticates with it — so a duplicate still
  // needs a real conflict check (see updateProfile.ts), not just format
  // validation. Same length rule as signup's own `username` field.
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters."),
  // The login identity, also `@unique` — a duplicate here is a real privacy
  // risk (two accounts could otherwise share a mailbox), so this gets the
  // same conflict check as username, not just format validation.
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  firstName: optionalProfileText(100, "First name"),
  lastName: optionalProfileText(100, "Last name"),
  institution: optionalProfileText(200, "Institution"),
  orcid: z
    .string()
    .trim()
    .refine((value) => !value || ORCID_PATTERN.test(value), {
      message: "Must be a valid ORCID (e.g. 0000-0002-1825-0097)",
    }),
  // Deliberately separate from the account's login email — lets a user keep
  // a private login address while showing a Gravatar tied to a different,
  // public-facing one. Same field STAPLE's User row already has.
  gravatar: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Must be a valid email address.",
    }),
  language: z.enum(PROFILE_LANGUAGE_VALUES),
  theme: z.enum(PROFILE_THEME_VALUES),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
