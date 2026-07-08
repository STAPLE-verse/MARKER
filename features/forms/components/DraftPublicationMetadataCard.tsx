"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/Button"
import { CardActions } from "@/components/ui/Card"
import { Form } from "@/components/ui/Form"
import { DraftPublicationMetadataInput, draftPublicationMetadataSchema } from "@/features/forms/schemas"
import { FormVersionDTO } from "@/features/forms/types"
import { useSavePublicationMetadata } from "@/features/forms/hooks/useSavePublicationMetadata"
import {
  normalizePublicationMetadata,
  publicationMetadataToFormValues,
} from "@/features/forms/utils/publicationMetadata"
import { toIsoTimestamp } from "@/features/forms/utils/timestamps"
import { PublicationMetadataCardShell } from "./PublicationMetadataCardShell"
import { PublicationMetadataFieldsDisplay } from "./publication/PublicationMetadataFieldsDisplay"
import { PublicationMetadataForm } from "./publication/PublicationMetadataForm"

interface DraftPublicationMetadataCardProps {
  formId: number
  version: FormVersionDTO
}

function versionMetadataKey(version: FormVersionDTO, updatedAt: Date | string | null | undefined): string {
  return `${version.id}:${updatedAt ? toIsoTimestamp(updatedAt) : "none"}`
}

export function DraftPublicationMetadataCard({ formId, version }: DraftPublicationMetadataCardProps) {
  const currentVersionMetadataKey = versionMetadataKey(version, version.publicationMetadata?.updatedAt)
  const syncedVersionMetadataKeyRef = useRef(currentVersionMetadataKey)
  const [isEditing, setIsEditing] = useState(false)
  const [committedMetadata, setCommittedMetadata] = useState(() =>
    normalizePublicationMetadata(version.publicationMetadata)
  )
  const [metadataUpdatedAt, setMetadataUpdatedAt] = useState<Date | string | null>(
    version.publicationMetadata?.updatedAt ?? null
  )
  const form = useForm<DraftPublicationMetadataInput>({
    resolver: zodResolver(draftPublicationMetadataSchema),
    defaultValues: publicationMetadataToFormValues(version.publicationMetadata),
  })

  useEffect(() => {
    if (syncedVersionMetadataKeyRef.current === currentVersionMetadataKey) return

    const nextMetadata = normalizePublicationMetadata(version.publicationMetadata)

    syncedVersionMetadataKeyRef.current = currentVersionMetadataKey
    setCommittedMetadata(nextMetadata)
    setMetadataUpdatedAt(version.publicationMetadata?.updatedAt ?? null)
    form.reset(publicationMetadataToFormValues(nextMetadata))
    setIsEditing(false)
  }, [form, currentVersionMetadataKey, version.publicationMetadata])

  const { save, isSaving } = useSavePublicationMetadata({
    formId,
    formVersionId: version.id,
    metadataUpdatedAt,
    form,
    onSaveSuccess: ({ updatedAt, metadata }) => {
      syncedVersionMetadataKeyRef.current = versionMetadataKey(version, updatedAt)
      setCommittedMetadata(metadata)
      setMetadataUpdatedAt(updatedAt)
      form.reset(publicationMetadataToFormValues(metadata))
      setIsEditing(false)
    },
  })

  const handleCancel = () => {
    form.reset(publicationMetadataToFormValues(committedMetadata))
    setIsEditing(false)
  }

  return (
    <PublicationMetadataCardShell collapsible={!isEditing} defaultOpen>
      {isEditing ? (
        <Form form={form} onSubmit={save} className="gap-6">
          <fieldset disabled={isSaving} className="contents">
            <PublicationMetadataForm form={form} />
          </fieldset>
          <CardActions>
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardActions>
        </Form>
      ) : (
        <>
          <PublicationMetadataFieldsDisplay metadata={committedMetadata} />
          <CardActions>
            <Button type="button" variant="primary" outline onClick={() => setIsEditing(true)}>
              Edit metadata
            </Button>
          </CardActions>
        </>
      )}
    </PublicationMetadataCardShell>
  )
}
