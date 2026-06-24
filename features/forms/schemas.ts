import { z } from "zod"

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

export type CreateFormInput = z.infer<typeof createFormSchema>

export const saveFormVersionSchema = z.object({
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

export const publishFormSchema = z.object({
  domain: z.string().min(1, "Please select a domain/discipline"),
  language: z.string().min(1, "Please select a primary language"),
  license: z.string().min(1, "License is required"),
  contributors: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      role: z.string().min(1, "Role is required"),
      orcid: z.string().optional(),
    })
  ).min(1, "At least one contributor is required"),
  keywords: z.array(z.string()).min(1, "Please provide at least one keyword"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be a valid semantic version (e.g., 1.0.0)"),
  releaseNotes: z.string().optional(),
  relatedPublicationDoi: z.string().optional(),
})

export type PublishFormInput = z.infer<typeof publishFormSchema>

export const publishSchemaActionSchema = publishFormSchema.extend({
  formId: z.number(),
});

export type PublishSchemaActionInput = z.infer<typeof publishSchemaActionSchema>
