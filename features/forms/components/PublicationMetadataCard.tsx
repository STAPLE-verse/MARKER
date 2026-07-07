import { Card, CardBody, CardTitle } from "@/components/ui/Card"
import { PublishedSchemaSummaryDTO } from "@/features/forms/types"
import { PublicationMetadataFieldsDisplay } from "./publication/PublicationMetadataFieldsDisplay"

interface PublicationMetadataCardProps {
  publishedSchema: PublishedSchemaSummaryDTO
}

export function PublicationMetadataCard({ publishedSchema }: PublicationMetadataCardProps) {
  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Publication Metadata</CardTitle>
        <PublicationMetadataFieldsDisplay
          metadata={publishedSchema}
          releaseNotes={publishedSchema.releaseNotes}
        />
      </CardBody>
    </Card>
  )
}
