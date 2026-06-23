import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaDetailHeaderProps {
  formId: number;
  version: FormVersionDTO;
  isViewingLatest: boolean;
  onClone: () => void;
  isCloning: boolean;
}

/**
 * Header for the owner's schema detail page: title + status badges + the
 * route-specific action buttons (clone / edit / publish / view public). Lives in
 * the route folder because its actions are tied to this page's routes.
 */
export function SchemaDetailHeader({
  formId,
  version,
  isViewingLatest,
  onClone,
  isCloning,
}: SchemaDetailHeaderProps) {
  const isPublished = version.status === "PUBLISHED";
  const pid = version.publishedSchema?.pid || null;

  return (
    <PageHeader
      title={<SchemaHeaderTitle version={version} />}
      description={pid ? <span className="font-mono text-primary text-xs">PID: {pid}</span> : null}
    >
      <div className="flex gap-2 items-center">
        <Button variant="secondary" outline size="sm" onClick={onClone} disabled={isCloning}>
          {isCloning ? "Cloning..." : "Clone"}
        </Button>
        {isViewingLatest && (
          <>
            {!isPublished ? (
              <>
                <Link href={`/collection/${formId}/edit`}>
                  <Button variant="primary" outline size="sm">
                    Edit Structure
                  </Button>
                </Link>
                <Link href={`/collection/${formId}/publish`}>
                  <Button variant="primary" size="sm">
                    Publish Schema
                  </Button>
                </Link>
              </>
            ) : (
              pid && (
                <Link href={`/schemas/${pid}`}>
                  <Button variant="secondary" size="sm">
                    View Public URL
                  </Button>
                </Link>
              )
            )}
          </>
        )}
      </div>
    </PageHeader>
  );
}
