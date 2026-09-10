import { z } from "zod"

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

export type CreateFormInput = z.infer<typeof createFormSchema>

/** Optimistic concurrency: the head version the client loaded and its last-known `updatedAt`. */
export const formVersionConcurrencySchema = z.object({
  formVersionId: z.number(),
  expectedUpdatedAt: z.string().datetime(),
})

export type FormVersionConcurrencyInput = z.infer<typeof formVersionConcurrencySchema>

export const saveFormVersionSchema = formVersionConcurrencySchema.extend({
  formId: z.number(),
  schema: z.record(z.string(), z.any()),
  uiSchema: z.record(z.string(), z.any()).optional(),
  // Semantic V1 component. Omitted = don't touch the stored value (update paths);
  // explicit `null` = clear it. See features/forms/actions/saveFormVersion.ts.
  semantics: z.unknown().nullable().optional(),
})

export type SaveFormVersionInput = z.infer<typeof saveFormVersionSchema>

export const formIdActionSchema = z.object({
  formId: z.number(),
})

export type FormIdActionInput = z.infer<typeof formIdActionSchema>

export const restoreFormVersionAsDraftSchema = z.object({
  formId: z.number(),
  versionId: z.number(),
})

export type RestoreFormVersionAsDraftInput = z.infer<typeof restoreFormVersionAsDraftSchema>

export const deleteFormVersionSchema = z.object({
  formId: z.number(),
  versionId: z.number(),
})

export type DeleteFormVersionInput = z.infer<typeof deleteFormVersionSchema>

export const cloneFormVersionSchema = z.object({
  versionId: z.number(),
})

export type CloneFormVersionInput = z.infer<typeof cloneFormVersionSchema>

const publicationContributorAffiliationSchema = z.object({
  name: z.string(),
})

// Format-only (not the ISO 7064 mod-11-2 checksum) — MARKER's own choice to
// validate ORCID specifically, independent of marker-template-spec: Core V1's
// agentIdentifier.value only requires a generic URI, and scheme isn't even a
// controlled vocabulary, so there's no spec rule to defer to here.
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
const orcidField = z.string().optional().refine(
  (value) => !value || ORCID_PATTERN.test(value),
  { message: "Must be a valid ORCID (e.g. 0000-0002-1825-0097)" }
)

export const draftPublicationContributorSchema = z.object({
  name: z.string().optional(),
  nameType: z.enum(["Personal", "Organizational"]).optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  roles: z.array(z.string()).optional(),
  orcid: orcidField.nullable(),
  affiliations: z.array(publicationContributorAffiliationSchema).optional(),
})

export const strictPublicationContributorSchema = draftPublicationContributorSchema.extend({
  name: z.string().min(1, "Name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  // `orcid` stays nullable here too (inherited from the draft schema below) —
  // ORCID itself is optional even for a strict/published contributor;
  // `ContributorDTO.orcid` (and therefore anything re-validating a value
  // already normalized through `mapContributors`) is `string | null`, never
  // `undefined`.
})

// Matches Core V1's keywords rule (items minLength 1, uniqueItems) — was
// previously unenforced by zod, relying only on TagsInput's incidental UI
// dedup rather than a real guarantee at the validation boundary.
const keywordItem = z.string().min(1)
const uniqueKeywords = (schema: z.ZodArray<typeof keywordItem>) =>
  schema.refine((arr) => new Set(arr).size === arr.length, { message: "Keywords must be unique" })

export const draftPublicationMetadataSchema = z.object({
  domain: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  contributors: z.array(draftPublicationContributorSchema).optional(),
  keywords: uniqueKeywords(z.array(keywordItem)).optional(),
})

export const strictPublicationMetadataSchema = draftPublicationMetadataSchema.extend({
  domain: z.string().min(1, "Please select a domain/discipline"),
  language: z.string().min(1, "Please select a primary language"),
  license: z.string().min(1, "License is required"),
  contributors: z.array(strictPublicationContributorSchema).min(1, "At least one contributor is required"),
  keywords: uniqueKeywords(z.array(keywordItem).min(1, "Please provide at least one keyword")),
})

export type DraftPublicationMetadataInput = z.infer<typeof draftPublicationMetadataSchema>

export const savePublicationMetadataSchema = draftPublicationMetadataSchema.extend({
  formId: z.number(),
  formVersionId: z.number(),
  expectedMetadataUpdatedAt: z.string().datetime().optional(),
})

export type SavePublicationMetadataInput = z.infer<typeof savePublicationMetadataSchema>

// Step 3's own fields — the only ones actually submitted to `publishSchema`.
// Steps 1-2's FAIR metadata/contributors are persisted separately, through
// `savePublicationMetadata` (see PublishSchemaClient.tsx); `publishSchema`
// reads that row rather than accepting it as input.
export const publishReviewSchema = z.object({
  // Matches Core V1's exact published-version pattern (rejects leading
  // zeros, e.g. "01.2.3") — an interim patch, not the long-term answer to
  // keeping zod and the spec's own validator in sync; see the "Phase 1"
  // plan note on delegating spec-shape rules to the runtime validator
  // itself instead of hand-mirroring them here.
  version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Must be a valid semantic version (e.g., 1.0.0)"),
  // Package-level description (marker-template-spec metadata.description) —
  // distinct from the form schema's own description, which is shown to
  // people filling out the rendered form. See Step3Review.tsx.
  description: z.string().min(1, "A description is required"),
  releaseNotes: z.string().optional(),
  relatedPublicationDoi: z.string().optional(),
})

export type PublishReviewInput = z.infer<typeof publishReviewSchema>

// The wizard's full client-side form: Steps 1-2's FAIR metadata/contributors
// (rendered through the same fields/validation the draft card uses) plus
// Step 3's review fields.
export const publishFormSchema = strictPublicationMetadataSchema.merge(publishReviewSchema)

export type PublishFormInput = z.infer<typeof publishFormSchema>

export const publishSchemaActionSchema = publishReviewSchema.extend({
  formId: z.number(),
  formVersionId: z.number(),
  expectedUpdatedAt: z.string().datetime(),
});

export type PublishSchemaActionInput = z.infer<typeof publishSchemaActionSchema>

export const importFromStapleSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("create"),
    sourceFormId: z.number().int().positive(),
    sourceVersionId: z.number().int().positive(),
  }),
  z.object({
    mode: z.literal("update"),
    sourceFormId: z.number().int().positive(),
    sourceVersionId: z.number().int().positive(),
    targetMarkerFormId: z.number().int().positive(),
    // True only after the user has explicitly confirmed overwriting local
    // MARKER edits made since the last import (docs/refactor/staple-import-phase3.md §6a).
    confirmOverwrite: z.boolean().optional(),
  }),
])

export type ImportFromStapleInput = z.infer<typeof importFromStapleSchema>

export const getStapleVersionPreviewSchema = z.object({
  sourceFormId: z.number().int().positive(),
  sourceVersionId: z.number().int().positive(),
})

export type GetStapleVersionPreviewInput = z.infer<typeof getStapleVersionPreviewSchema>
