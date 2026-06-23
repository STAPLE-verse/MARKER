import { Badge } from "@/components/ui/Badge";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaStatusBadgesProps {
  version: FormVersionDTO;
}

/**
 * Renders the version + draft/published status badge pair for a form version.
 * Derives the published semantic version when available, otherwise falls back to
 * the draft version number.
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
      <Badge variant={isPublished ? "success" : "warning"} className="shrink-0 mt-0.5">
        {isPublished ? "Published" : "Draft"}
      </Badge>
    </>
  );
}
