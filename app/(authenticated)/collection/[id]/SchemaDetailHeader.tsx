import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SchemaHeaderTitle } from "@/features/forms/components/SchemaHeaderTitle";
import { ArchiveFormButton } from "@/features/forms/components/ArchiveFormButton";
import { PermanentlyDeleteFormButton } from "@/features/forms/components/PermanentlyDeleteFormButton";
import { RecoverFormButton } from "@/features/forms/components/RecoverFormButton";
import { UpdateFromStapleButton } from "@/features/forms/components/UpdateFromStapleButton";
import { FormVersionDTO, StapleImportInfoDTO } from "@/features/forms/types";

interface SchemaDetailHeaderProps {
  formId: number;
  version: FormVersionDTO;
  isViewingLatest: boolean;
  archived: boolean;
  hasPublishedVersion: boolean;
  stapleImport: StapleImportInfoDTO | null;
  onClone: () => void;
  isCloning: boolean;
  onRestore: () => void;
  isRestoring: boolean;
}

interface StapleImportBadgesProps {
  /** This *version's own* frozen source version number, if known — see FormVersionDTO.stapleProvenance. */
  sourceVersionNumber: number | null;
  /** This version's own frozen modification status — meaningful on any version, historical or head. */
  modificationStatus?: StapleImportInfoDTO["modificationStatus"];
}

function StapleImportBadges({ sourceVersionNumber, modificationStatus }: StapleImportBadgesProps) {
  // "Imported from STAPLE" is a present-tense identity claim — only true
  // while this version's content still matches that import verbatim. Once
  // native edits diverge it, however many edits removed, "Based on STAPLE
  // import" is the honest lineage claim instead. UNKNOWN (pre-migration
  // rows with no baseline hash to compare against) keeps the stronger
  // wording, matching its pre-existing behavior.
  const label = modificationStatus === "MODIFIED" ? "Based on STAPLE import" : "Imported from STAPLE";
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="badge badge-ghost badge-sm font-mono">
        {label}
        {sourceVersionNumber != null && ` · v${sourceVersionNumber}`}
      </span>
      {modificationStatus && modificationStatus !== "UNKNOWN" && (
        <span
          className={`badge badge-sm ${
            modificationStatus === "MODIFIED" ? "badge-warning" : "badge-success"
          }`}
        >
          {modificationStatus === "MODIFIED" ? "Modified since import" : "Unmodified since import"}
        </span>
      )}
    </span>
  );
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
  stapleImport,
  onClone,
  isCloning,
  onRestore,
  isRestoring,
}: SchemaDetailHeaderProps) {
  const isPublished = version.status === "PUBLISHED";
  const pid = version.publishedSchema?.pid || null;
  const schemaTitle = version.name || "Untitled Draft";
  // This version's own frozen provenance — both the source version number
  // and the modification status are correct for any version, historical or
  // current (see FormVersionDTO.stapleProvenance). Falls back to MarkerForm's
  // mutable fields only when viewing latest and the per-version value is
  // missing — i.e. a version created before this field existed; never
  // fabricated for a genuinely historical version.
  const sourceVersionNumber =
    version.stapleProvenance?.sourceVersionNumber ??
    (isViewingLatest ? stapleImport?.sourceVersionNumber ?? null : null);
  const showStapleImportBadges = sourceVersionNumber != null;
  const modificationStatus = version.stapleProvenance
    ? version.stapleProvenance.modificationStatus
    : isViewingLatest
      ? stapleImport?.modificationStatus
      : undefined;
  const description =
    pid || showStapleImportBadges ? (
      <span className="inline-flex items-center gap-2 flex-wrap">
        {pid && <span className="font-mono text-primary text-xs">PID: {pid}</span>}
        {showStapleImportBadges && (
          <StapleImportBadges sourceVersionNumber={sourceVersionNumber} modificationStatus={modificationStatus} />
        )}
      </span>
    ) : null;

  if (archived) {
    return (
      <PageHeader title={<SchemaHeaderTitle version={version} />} description={description}>
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
    <PageHeader title={<SchemaHeaderTitle version={version} />} description={description}>
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
            {stapleImport && <UpdateFromStapleButton formId={formId} />}
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
