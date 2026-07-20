import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import { ArchiveFormButton } from "@/features/forms/components/ArchiveFormButton";
import { PermanentlyDeleteFormButton } from "@/features/forms/components/PermanentlyDeleteFormButton";
import { RecoverFormButton } from "@/features/forms/components/RecoverFormButton";
import { FormVersionDTO } from "@/features/forms/types";

interface SchemaDetailHeaderProps {
  formId: number;
  version: FormVersionDTO;
  isViewingLatest: boolean;
  archived: boolean;
  hasPublishedVersion: boolean;
  onClone: () => void;
  isCloning: boolean;
  onRestore: () => void;
  isRestoring: boolean;
}

/**
 * Header for the owner's schema detail page: title + version labels + the
 * route-specific action buttons (clone / edit / publish / view public). Lives in
 * the route folder because its actions are tied to this page's routes.
 */
export function SchemaDetailHeader({
  formId,
  version,
  isViewingLatest,
  archived,
  hasPublishedVersion,
  onClone,
  isCloning,
  onRestore,
  isRestoring,
}: SchemaDetailHeaderProps) {
  const isPublished = version.status === "PUBLISHED";
  const pid = version.publishedSchema?.pid || null;
  const schemaTitle = version.name || "Untitled Draft";

  if (archived) {
    return (
      <PageHeader
        title={<SchemaHeaderTitle version={version} />}
        description={pid ? <span className="font-mono text-primary text-xs">PID: {pid}</span> : null}
      >
        <div className="flex gap-2 items-center">
          <RecoverFormButton formId={formId} schemaTitle={schemaTitle} />
          {!hasPublishedVersion && (
            <PermanentlyDeleteFormButton formId={formId} schemaTitle={schemaTitle} />
          )}
        </div>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      title={<SchemaHeaderTitle version={version} />}
      description={pid ? <span className="font-mono text-primary text-xs">PID: {pid}</span> : null}
    >
      <div className="flex gap-2 items-center">
        <Button variant="secondary" outline size="sm" onClick={onClone} disabled={isCloning}>
          {isCloning ? "Cloning..." : "Clone"}
        </Button>
        {!isViewingLatest && (
          <Button variant="primary" size="sm" onClick={onRestore} disabled={isRestoring}>
            {isRestoring ? "Restoring..." : "Restore as New Draft"}
          </Button>
        )}
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
        <ArchiveFormButton
          formId={formId}
          schemaTitle={schemaTitle}
          hasPublishedVersion={hasPublishedVersion}
        />
      </div>
    </PageHeader>
  );
}
