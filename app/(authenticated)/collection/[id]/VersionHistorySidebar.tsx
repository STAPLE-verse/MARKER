import Link from "next/link";
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/Sidebar";
import { DashedAddButton } from "@/components/ui/DashedAddButton";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
    <Sidebar 
      className={`absolute right-0 top-0 bottom-0 z-20 border-l border-base-300 shadow-2xl overflow-hidden transition-all duration-300 ${
        isHistoryOpen ? "w-80 lg:w-96" : "w-16 min-w-[4rem] lg:w-16 shadow-none"
      }`}
    >
      <SidebarHeader 
        className={`bg-base-200/50 flex ${
          isHistoryOpen ? "justify-between p-4" : "justify-center p-2"
        }`}
      >
        {isHistoryOpen && (
          <div className="flex items-center gap-2 text-lg font-bold">
            <ClockIcon className="w-5 h-5" />
            Version History
          </div>
        )}
        <div className={!isHistoryOpen && versions.length > 1 ? "indicator" : ""}>
          {!isHistoryOpen && versions.length > 1 && (
            <Badge size="xs" variant="primary" className="indicator-item indicator-top indicator-end shadow-sm">
              {versions.length}
            </Badge>
          )}
          <button 
            className="btn btn-sm btn-ghost btn-circle" 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            title="Toggle Version History"
            type="button"
          >
            {isHistoryOpen ? <XMarkIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
          </button>
        </div>
      </SidebarHeader>
      
      {isHistoryOpen ? (
        <SidebarContent className="space-y-3 bg-base-200/30">
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
        </SidebarContent>
      ) : (
        <div className="flex-1 bg-base-200/30 flex flex-col items-center pt-4">
          <div 
            className="text-vertical writing-mode-vertical-rl rotate-180 text-sm font-semibold tracking-widest text-base-content/40 uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            History
          </div>
        </div>
      )}
    </Sidebar>
  );
}
