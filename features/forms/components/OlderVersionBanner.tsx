import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormVersionDTO } from "@/features/forms/types";

interface OlderVersionBannerProps {
  version: FormVersionDTO;
}

/**
 * Warning banner shown when the user is viewing a version that is not the latest.
 * "Restore this Version" is a placeholder action pending the restore flow.
 */
export function OlderVersionBanner({ version }: OlderVersionBannerProps) {
  const isPublished = version.status === "PUBLISHED";
  const label = isPublished
    ? `v${version.publishedSchema?.version} (Release)`
    : `Draft ${version.version}`;

  return (
    <Alert variant="warning" className="mb-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
        <div className="text-base">
          <span className="font-bold">Viewing older version:</span> {label}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="primary">
            Restore this Version
          </Button>
        </div>
      </div>
    </Alert>
  );
}
