import { PublicationMetadataFieldsDTO } from "@/features/forms/types"
import { PublicationMetadataCardShell } from "./PublicationMetadataCardShell"
import { PublicationMetadataFieldsDisplay } from "./publication/PublicationMetadataFieldsDisplay"

interface PublicationMetadataCardProps {
  metadata: PublicationMetadataFieldsDTO | null
  releaseNotes?: string | null
  collapsible?: boolean
  defaultOpen?: boolean
}

export function PublicationMetadataCard({
  metadata,
  releaseNotes,
  collapsible = true,
  defaultOpen = true,
}: PublicationMetadataCardProps) {
  return (
    <PublicationMetadataCardShell collapsible={collapsible} defaultOpen={defaultOpen}>
      <PublicationMetadataFieldsDisplay metadata={metadata} releaseNotes={releaseNotes} />
    </PublicationMetadataCardShell>
  )
}
