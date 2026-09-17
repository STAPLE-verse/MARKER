import { Badge } from "@/components/ui/Badge";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaStatusBadgesProps {
  version: FormVersionDTO;
}

/**
 * Renders the visible version label plus published status when applicable.
 * Draft status is already encoded in labels like "Draft 1".
 *
 * The PID used to be its own always-visible text line below the title; it's
 * reference detail (citation/deep-linking), not something that needs
 * permanent screen space, and "Published" already tells you a PID exists at
 * all — so it lives in a tooltip on this badge instead, same pattern this
 * header already uses for STAPLE-import/fork provenance detail.
 */
export function SchemaStatusBadges({ version }: SchemaStatusBadgesProps) {
  const isPublished = version.status === "PUBLISHED";
  const versionLabel = isPublished
    ? `v${version.publishedSchema?.version || version.version}`
    : `Draft ${version.version}`;
  const pid = version.publishedSchema?.pid;

  return (
    <>
      <Badge variant="primary" className="shrink-0 mt-0.5">
        {versionLabel}
      </Badge>
      {isPublished && (
        <Badge
          variant="success"
          className={
            pid ? "shrink-0 mt-0.5 tooltip tooltip-bottom z-10 before:max-w-xs cursor-help" : "shrink-0 mt-0.5"
          }
          data-tip={pid ? `PID: ${pid}` : undefined}
        >
          Published
        </Badge>
      )}
    </>
  );
}
