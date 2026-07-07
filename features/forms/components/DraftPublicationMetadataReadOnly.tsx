import { Card, CardBody, CardTitle } from "@/components/ui/Card"
import { PublicationMetadataFieldsDTO } from "@/features/forms/types"
import { PublicationMetadataFieldsDisplay } from "./publication/PublicationMetadataFieldsDisplay"

interface DraftPublicationMetadataReadOnlyProps {
  metadata: PublicationMetadataFieldsDTO | null
}

export function DraftPublicationMetadataReadOnly({ metadata }: DraftPublicationMetadataReadOnlyProps) {
  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">
          Publication Metadata
        </CardTitle>
        <PublicationMetadataFieldsDisplay metadata={metadata} />
      </CardBody>
    </Card>
  )
}
