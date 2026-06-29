"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardTitle } from "@/components/ui/Card"
import { Form } from "@/components/ui/Form"
import { DraftPublicationMetadataInput, draftPublicationMetadataSchema } from "@/features/forms/schemas"
import { FormVersionDTO } from "@/features/forms/types"
import { useSavePublicationMetadata } from "@/features/forms/hooks/useSavePublicationMetadata"
import { PublicationMetadataForm } from "./publication/PublicationMetadataForm"

interface DraftPublicationMetadataCardProps {
  formId: number
  version: FormVersionDTO
}

export function DraftPublicationMetadataCard({ formId, version }: DraftPublicationMetadataCardProps) {
  const [metadataUpdatedAt, setMetadataUpdatedAt] = useState<Date | string | null>(
    version.publicationMetadata?.updatedAt ?? null
  )
  const form = useForm<DraftPublicationMetadataInput>({
    resolver: zodResolver(draftPublicationMetadataSchema),
    defaultValues: {
      domain: version.publicationMetadata?.domain ?? "",
      language: version.publicationMetadata?.language ?? "en",
      license: version.publicationMetadata?.license ?? "CC-BY 4.0",
      keywords: version.publicationMetadata?.keywords ?? [],
      contributors: version.publicationMetadata?.contributors ?? [],
    },
  })
  const { save, isSaving } = useSavePublicationMetadata({
    formId,
    formVersionId: version.id,
    metadataUpdatedAt,
    form,
    onSaveSuccess: setMetadataUpdatedAt,
  })

  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">
          Publication Metadata
        </CardTitle>
        <div className="mb-6">
          <Alert variant="info" title="Draft publication metadata">
            These details are private until this schema is published. They will pre-fill the publication wizard.
          </Alert>
        </div>

        <Form form={form} onSubmit={save} className="gap-6">
          <PublicationMetadataForm form={form} />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save publication metadata"}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}
