import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/Sidebar";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/Badge";
import { FormWithAllVersions } from "@/features/forms/types";

type FormVersionType = FormWithAllVersions["versions"][0];

interface VersionHistorySidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  versions: FormVersionType[];
  selectedVersion: FormVersionType;
  setSelectedVersion: (version: FormVersionType) => void;
}

export function VersionHistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  versions,
  selectedVersion,
  setSelectedVersion,
}: VersionHistorySidebarProps) {
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
        <button 
          className="btn btn-sm btn-ghost btn-circle" 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          title="Toggle Version History"
        >
          {isHistoryOpen ? <XMarkIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
        </button>
      </SidebarHeader>
      
      {isHistoryOpen ? (
        <SidebarContent className="space-y-3 bg-base-200/30">
          {versions.map((v) => {
            const isLatest = v.id === versions[0].id;
            const isSelected = v.id === selectedVersion.id;
            return (
              <div 
                key={v.id} 
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-base-300 hover:border-base-content/30 bg-base-100"
                }`}
                onClick={() => setSelectedVersion(v)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold flex items-center gap-2">
                    v{v.version}
                    {isLatest && <Badge size="sm" variant="success">Latest</Badge>}
                  </div>
                  <div className="text-xs text-base-content/50 whitespace-nowrap">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-base-content/70 truncate">
                  {v.name || "Untitled Draft"}
                </div>
              </div>
            )
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
