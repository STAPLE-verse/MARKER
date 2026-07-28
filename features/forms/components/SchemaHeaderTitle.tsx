import { SchemaStatusBadges } from "./SchemaStatusBadges";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaHeaderTitleProps {
  version: FormVersionDTO;
  /** Optional context label rendered before the name, e.g. "Form Builder" or "Publishing". */
  prefix?: string;
  /** Overrides the displayed name (defaults to the version's name). */
  name?: string;
}

/**
 * Shared page-header title cluster for the form lifecycle pages (detail, edit,
 * publish): an optionally-prefixed, truncating name followed by version/status
 * labels. Keeps the three headers visually consistent.
 */
export function SchemaHeaderTitle({ version, prefix, name }: SchemaHeaderTitleProps) {
  const displayName = name || version.name || "Untitled Form";
  const tooltip = prefix ? `${prefix}: ${displayName}` : displayName;

  return (
    <div className="flex items-center gap-3 flex-nowrap">
      <span className="truncate" title={tooltip}>
        {prefix ? (
          <>
            <span className="text-base-content/50 font-normal">{prefix}:</span> {displayName}
          </>
        ) : (
          displayName
        )}
      </span>
      <SchemaStatusBadges version={version} />
    </div>
  );
}
