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
})

export type SaveFormVersionInput = z.infer<typeof saveFormVersionSchema>

export const deleteFormSchema = z.object({
  formId: z.number(),
})

export type DeleteFormInput = z.infer<typeof deleteFormSchema>

export const formIdActionSchema = z.object({
  formId: z.number(),
})

export type FormIdActionInput = z.infer<typeof formIdActionSchema>

export const cloneFormVersionSchema = z.object({
  versionId: z.number(),
})

export type CloneFormVersionInput = z.infer<typeof cloneFormVersionSchema>

export const draftPublicationContributorSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  orcid: z.string().optional().nullable(),
})

export const strictPublicationContributorSchema = draftPublicationContributorSchema.extend({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
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
