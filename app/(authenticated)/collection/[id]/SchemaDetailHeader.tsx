import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { DropdownItem } from "@/components/ui/Dropdown";
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
  /**
   * When this row's own import/last-update-import happened. STAPLE only bumps
   * a form's version number when it's task-attached — otherwise edits mutate
   * the same version number in place, so "v1" alone can silently mean
   * different content at different times. Folding it into the tooltip is
   * what actually disambiguates two same-numbered imports in MARKER's history.
   */
  importedAt: Date | null;
  /** This version's own frozen modification status — meaningful on any version, historical or head. */
  modificationStatus?: StapleImportInfoDTO["modificationStatus"];
}

/**
 * A single terse, colored badge, rendered via the shared `Badge` component —
 * same recipe (no `size`, no `font-mono`) as `SchemaStatusBadges`' Draft/
 * Published pills it sits next to, so it matches them exactly rather than
 * looking like a visually distinct chip. "STAPLE," the source version
 * number, and the import timestamp all live in the tooltip rather than
 * inline, matching the version history sidebar's Import badge (that's not
 * upfront-visible detail most viewers need on every glance). Color + the
 * one-word label jointly carry modification status (green "Imported" vs.
 * amber "Based on import"), so no separate Modified/Unmodified badge is
 * needed — the label itself already distinguishes them, not color alone, so
 * this isn't a color-only signal. UNKNOWN (no baseline hash, e.g.
 * pre-migration rows) gets no color claim either way.
 *
 * Outlined, not solid — Draft/Published (SchemaStatusBadges) are this
 * form's core lifecycle state and get the full/solid treatment; this badge
 * is supplementary provenance, so it stays visually subordinate rather than
 * competing with (or outshouting) the status badge it sits next to.
 */
function StapleImportBadge({ sourceVersionNumber, importedAt, modificationStatus }: StapleImportBadgesProps) {
  const isModified = modificationStatus === "MODIFIED";
  const isKnown = modificationStatus != null && modificationStatus !== "UNKNOWN";
  const label = isModified ? "Based on import" : "Imported";
  const variant = isKnown ? (isModified ? "warning" : "success") : "ghost";

  const detail = [
    sourceVersionNumber != null ? `v${sourceVersionNumber}` : null,
    importedAt != null
      ? importedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const tooltip = detail ? `Imported from STAPLE · ${detail}` : undefined;

  return (
    <Badge
      variant={variant}
      outline
      className={
        // z-10, not z-50: AppNavbar is `sticky ... z-50` — a badge at the
        // same z-index sits in a different stacking context (page content
        // vs. the sticky nav) and, at a tie, paints on top of it instead of
        // scrolling behind it as the page scrolls. z-10 is still well above
        // this badge's own unstacked siblings (enough for the tooltip
        // popover to clear them) without ever competing with the navbar.
        tooltip ? "shrink-0 mt-0.5 tooltip tooltip-bottom z-10 before:max-w-xs cursor-help" : "shrink-0 mt-0.5"
      }
      data-tip={tooltip}
    >
      {label}
    </Badge>
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
  const importedAt =
    version.stapleProvenance?.importedAt ?? (isViewingLatest ? stapleImport?.importedAt ?? null : null);
  const stapleBadge = showStapleImportBadges ? (
    <StapleImportBadge
      sourceVersionNumber={sourceVersionNumber}
      importedAt={importedAt}
      modificationStatus={modificationStatus}
    />
  ) : null;
  const description = pid ? <span className="font-mono text-primary text-xs">PID: {pid}</span> : null;
  const title = <SchemaHeaderTitle version={version} extraBadges={stapleBadge} />;

  if (archived) {
    return (
      <PageHeader title={title} description={description}>
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
    <PageHeader title={title} description={description}>
      <div className="flex gap-2 items-center">
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
        {/* Secondary/occasional actions — kept out of the primary row so it
            doesn't grow with every action a form can support. */}
        <ActionMenu>
          <DropdownItem>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onClone}
              disabled={isCloning}
            >
              {isCloning ? "Cloning..." : "Clone"}
            </Button>
          </DropdownItem>
          {isViewingLatest && stapleImport && (
            <DropdownItem>
              <UpdateFromStapleButton formId={formId} />
            </DropdownItem>
          )}
          <DropdownItem>
            <ArchiveFormButton
              formId={formId}
              schemaTitle={schemaTitle}
              hasPublishedVersion={hasPublishedVersion}
              className="w-full justify-start"
            />
          </DropdownItem>
        </ActionMenu>
      </div>
    </PageHeader>
  );
}
