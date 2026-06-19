import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Contributor {
  name: string;
  role: string;
  orcid?: string | null;
}

interface PublicationMetadataCardProps {
  publishedSchema: {
    license: string;
    domain?: string | null;
    language: string;
    releaseNotes?: string | null;
    contributors?: any;
  };
}

export function PublicationMetadataCard({ publishedSchema }: PublicationMetadataCardProps) {
  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Publication Metadata</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">License</h4>
            <p className="font-medium">{publishedSchema.license}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">Domain</h4>
            <p className="font-medium capitalize">{publishedSchema.domain || "Not specified"}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">Language</h4>
            <p className="font-medium capitalize">{publishedSchema.language}</p>
          </div>
          
          {publishedSchema.releaseNotes && (
            <div className="md:col-span-3 mt-2">
              <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">Release Notes</h4>
              <p className="text-base-content/80 bg-base-200/50 p-3 rounded-lg text-sm border border-base-200">{publishedSchema.releaseNotes}</p>
            </div>
          )}
          
          {Array.isArray(publishedSchema.contributors) && publishedSchema.contributors.length > 0 && (
            <div className="md:col-span-3 mt-2">
              <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Contributors</h4>
              <div className="flex flex-wrap gap-2">
                {(publishedSchema.contributors as Contributor[]).map((c, i) => (
                  <Badge key={i} variant="primary" outline className="py-3 px-3 shadow-sm bg-base-100 gap-2 border-primary/30">
                    <span className="font-semibold text-primary">{c.name}</span>
                    <span className="text-base-content/60 text-xs font-medium uppercase tracking-wider">{c.role}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
