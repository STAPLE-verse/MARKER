import { Badge } from "@/components/ui/Badge";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaStatusBadgesProps {
  version: FormVersionDTO;
}

/**
 * Renders the visible version label plus published status when applicable.
 * Draft status is already encoded in labels like "Draft 1".
 */
export function SchemaStatusBadges({ version }: SchemaStatusBadgesProps) {
  const isPublished = version.status === "PUBLISHED";
  const versionLabel = isPublished
    ? `v${version.publishedSchema?.version || version.version}`
    : `Draft ${version.version}`;

  return (
    <>
      <Badge variant="primary" outline className="shrink-0 mt-0.5">
        {versionLabel}
      </Badge>
      {isPublished && (
        <Badge variant="success" className="shrink-0 mt-0.5">
          Published
        </Badge>
      )}
    </>
  );
}
