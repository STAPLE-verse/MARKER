import { Badge } from "@/components/ui/Badge"
import { Card, CardBody, CardTitle } from "@/components/ui/Card"
import { PublicationMetadataFieldsDTO } from "@/features/forms/types"

interface DraftPublicationMetadataReadOnlyProps {
  metadata: PublicationMetadataFieldsDTO | null
}

export function DraftPublicationMetadataReadOnly({ metadata }: DraftPublicationMetadataReadOnlyProps) {
  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">
          Draft Publication Metadata
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">License</h4>
            <p className="font-medium">{metadata?.license || "Not specified"}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">Domain</h4>
            <p className="font-medium capitalize">{metadata?.domain || "Not specified"}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">Language</h4>
            <p className="font-medium capitalize">{metadata?.language || "Not specified"}</p>
          </div>

          {metadata?.keywords && metadata.keywords.length > 0 && (
            <div className="md:col-span-3 mt-2">
              <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" outline className="font-medium">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata?.contributors && metadata.contributors.length > 0 && (
            <div className="md:col-span-3 mt-2">
              <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Contributors</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.contributors.map((contributor, index) => (
                  <Badge key={`${contributor.name}-${index}`} variant="primary" outline className="py-3 px-3 shadow-sm bg-base-100 gap-2 border-primary/30">
                    <span className="font-semibold text-primary">{contributor.name || "Unnamed"}</span>
                    <span className="text-base-content/60 text-xs font-medium uppercase tracking-wider">{contributor.role || "Role missing"}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
