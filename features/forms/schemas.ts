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

export const publishFormSchema = z.object({
  domain: z.string().min(1, "Please select a domain/discipline"),
  language: z.string().min(1, "Please select a primary language"),
  license: z.string().min(1, "License is required"),
  releaseNotes: z.string().optional(),
})

export type PublishFormInput = z.infer<typeof publishFormSchema>
