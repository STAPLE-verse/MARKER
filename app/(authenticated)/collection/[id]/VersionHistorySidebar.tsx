import Link from "next/link";
import { CollapsibleHistorySidebar } from "@/components/ui/CollapsibleHistorySidebar";
import { DashedAddButton } from "@/components/ui/DashedAddButton";
import { Badge } from "@/components/ui/Badge";
import { DeleteFormVersionButton } from "@/features/forms/components/DeleteFormVersionButton";
import { FormVersionDTO } from "@/features/forms/types";

type FormVersionType = FormVersionDTO;

interface VersionHistorySidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  versions: FormVersionType[];
  selectedVersion: FormVersionType;
  formId: number;
  onNewVersion: () => void;
  isCreatingVersion: boolean;
  /** When true, hide version-creation controls (archived forms are read-only). */
  readOnly?: boolean;
}

function getVersionLabel(version: FormVersionType): string {
  return version.status === "PUBLISHED"
    ? `v${version.publishedSchema?.version || version.version}`
    : `Draft ${version.version}`;
}

export function VersionHistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  versions,
  selectedVersion,
  formId,
  onNewVersion,
  isCreatingVersion,
  readOnly = false,
}: VersionHistorySidebarProps) {
  const canDeleteVersions = !readOnly && versions.length > 1;

  return (
    <CollapsibleHistorySidebar
      isOpen={isHistoryOpen}
      setIsOpen={setIsHistoryOpen}
      versionCount={versions.length}
    >
      {!readOnly && (
        <DashedAddButton
          onClick={onNewVersion}
          disabled={isCreatingVersion}
          title="New draft version (copy of latest)"
          aria-label="New draft version"
        />
      )}
      {versions.map((v) => {
        const isLatest = v.id === versions[0].id;
        const isSelected = v.id === selectedVersion.id;
        const versionLabel = getVersionLabel(v);
        const showDelete = canDeleteVersions && v.status === "DRAFT";

        return (
          <div
            key={v.id}
            className={`relative rounded-xl border transition-all ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-base-300 hover:border-base-content/30 bg-base-100"
            }`}
          >
            {showDelete && (
              <div
                className="absolute right-1 top-1 z-10"
                onClick={(event) => event.stopPropagation()}
              >
                <DeleteFormVersionButton
                  formId={formId}
                  versionId={v.id}
                  versionLabel={versionLabel}
                  versionName={v.name}
                  redirectTo={isSelected ? `/collection/${formId}` : undefined}
                />
              </div>
            )}
            <Link
              href={isLatest ? `/collection/${formId}` : `/collection/${formId}?version=${v.id}`}
              prefetch={false}
              scroll={false}
              aria-current={isSelected ? "page" : undefined}
              className={`block cursor-pointer p-4 ${showDelete ? "pr-9" : ""}`}
            >
              <div className={`flex flex-wrap items-center gap-2 font-semibold ${showDelete ? "pr-4" : ""}`}>
                {versionLabel}
                {v.status === "PUBLISHED" && <Badge size="sm" variant="success">Published</Badge>}
                {isLatest && <Badge size="sm" variant="primary">Latest</Badge>}
                {v.stapleProvenance?.isDirectImport && (
                  <Badge
                    size="sm"
                    variant={v.stapleProvenance.modificationStatus === "MODIFIED" ? "warning" : "success"}
                    outline
                    // z-10, not z-50 — see the matching comment on
                    // SchemaDetailHeader.tsx's StapleImportBadge:
                    // AppNavbar is sticky at z-50, and tying that
                    // z-index elsewhere risks painting over it instead
                    // of scrolling behind it.
                    className="tooltip tooltip-bottom z-10 before:max-w-[14rem] cursor-help"
                    data-tip={`Imported from STAPLE · v${v.stapleProvenance.sourceVersionNumber} · ${v.stapleProvenance.importedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`}
                  >
                    Import
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-end justify-between gap-2">
                <div className="min-w-0 truncate text-sm text-base-content/70">
                  {v.name || "Untitled Draft"}
                </div>
                <div className="shrink-0 whitespace-nowrap text-xs text-base-content/50">
                  {new Date(v.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </CollapsibleHistorySidebar>
  );
}
