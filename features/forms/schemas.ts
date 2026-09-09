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

export const draftPublicationContributorSchema = z.object({
  name: z.string().optional(),
  nameType: z.enum(["Personal", "Organizational"]).optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  roles: z.array(z.string()).optional(),
  orcid: z.string().optional().nullable(),
  affiliations: z.array(publicationContributorAffiliationSchema).optional(),
})

export const strictPublicationContributorSchema = draftPublicationContributorSchema.extend({
  name: z.string().min(1, "Name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  orcid: z.string().optional(),
})

export const draftPublicationMetadataSchema = z.object({
  domain: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  contributors: z.array(draftPublicationContributorSchema).optional(),
  keywords: z.array(z.string()).optional(),
})

export const strictPublicationMetadataSchema = draftPublicationMetadataSchema.extend({
  domain: z.string().min(1, "Please select a domain/discipline"),
  language: z.string().min(1, "Please select a primary language"),
  license: z.string().min(1, "License is required"),
  contributors: z.array(strictPublicationContributorSchema).min(1, "At least one contributor is required"),
  keywords: z.array(z.string()).min(1, "Please provide at least one keyword"),
})

export type DraftPublicationMetadataInput = z.infer<typeof draftPublicationMetadataSchema>

export const savePublicationMetadataSchema = draftPublicationMetadataSchema.extend({
  formId: z.number(),
  formVersionId: z.number(),
  expectedMetadataUpdatedAt: z.string().datetime().optional(),
})

export type SavePublicationMetadataInput = z.infer<typeof savePublicationMetadataSchema>

export const publishFormSchema = strictPublicationMetadataSchema.extend({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be a valid semantic version (e.g., 1.0.0)"),
  // Package-level description (marker-template-spec metadata.description) —
  // distinct from the form schema's own description, which is shown to
  // people filling out the rendered form. See Step3Review.tsx.
  description: z.string().min(1, "A description is required"),
  releaseNotes: z.string().optional(),
  relatedPublicationDoi: z.string().optional(),
})

export type PublishFormInput = z.infer<typeof publishFormSchema>

export const publishSchemaActionSchema = publishFormSchema.extend({
  formId: z.number(),
  formVersionId: z.number(),
  expectedUpdatedAt: z.string().datetime(),
});

export type PublishSchemaActionInput = z.infer<typeof publishSchemaActionSchema>
