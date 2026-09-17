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
import { CollaborationHeaderControls } from "@/features/forms/collaborators/components/CollaborationHeaderControls";
import type { CollaborationSummaryDTO } from "@/features/forms/collaborators/queries/getCollaborationSummary";
import { FormVersionDTO, StapleImportInfoDTO } from "@/features/forms/types";
import { canEditForm } from "@/features/forms/utils/formPermissions";

interface SchemaDetailHeaderProps {
  formId: number;
  version: FormVersionDTO;
  isViewingLatest: boolean;
  archived: boolean;
  hasPublishedVersion: boolean;
  stapleImport: StapleImportInfoDTO | null;
  /** Mutually exclusive with `stapleImport` — `MarkerForm.origin` is a single enum value. */
  forkedFrom: { pid: string; title: string } | null;
  /**
   * The caller's own resolved role (docs/refactor/form-collaboration.md §4.6)
   * — drives which actions render, but only in combination with
   * `isPendingInvite`: a not-yet-accepted invitee's `role` is their invited
   * role, not a granted one (see `FormDetailDTO.role`).
   */
  role: "OWNER" | "EDITOR" | "VIEWER";
  /** True while the viewer has a still-pending (unaccepted) invite — forces read-only regardless of `role`, and hides the collaborator list entirely (see below). */
  isPendingInvite: boolean;
  viewerUserId: number;
  /** `null` for a pending invitee — they aren't a member yet, so the page never fetches the collaborator list for them at all (see page.tsx). */
  collaboration: CollaborationSummaryDTO | null;
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
 *
 * TODO(generalize): named/shaped for STAPLE specifically because it's the
 * only import source today. Once another import destination exists
 * (`MarkerFormOrigin.IMPORTED_EXTERNAL` — CEDAR/REDCap adapters,
 * `forms-feature-plan.md` Phase 3), generalize this to a source-agnostic
 * `ImportBadge` rather than letting a second near-identical badge grow next
 * to it. NOT the same thing as a "forked from a PublishedSchema" badge —
 * forking isn't an import (no external system, no per-version recurrence,
 * see `MarkerForm.forkedFromPid`) and should stay its own component.
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

interface ForkedBadgeProps {
  forkedFrom: { pid: string; title: string };
}

/**
 * Distinct from `StapleImportBadge` — forking isn't an import (no external
 * system, and `MarkerForm.forkedFromPid` is set once at creation and applies
 * unchanged to every version, so there's no per-version/`isViewingLatest`
 * logic to carry here). No modification-status color/label either: MARKER
 * doesn't track a content hash for forks the way it does for STAPLE imports,
 * so there's nothing to distinguish "still identical to the fork source"
 * from "heavily modified since" — this is a permanent, undifferentiated
 * lineage marker, not a status indicator.
 *
 * Wrapped in a `Link`, not just a hover tooltip — unlike a STAPLE source
 * form (which needs a STAPLE session to view), the original `PublishedSchema`
 * page is always public and reachable, so clicking through is meaningful.
 */
function ForkedBadge({ forkedFrom }: ForkedBadgeProps) {
  return (
    // The classes that align this with its badge siblings (shrink-0, the
    // mt-0.5 nudge, the tooltip hooks) live on the Link, not the nested
    // Badge — Link (an <a>) is the actual flex item here, and a margin on a
    // non-flex-item child doesn't collapse into its flex-item parent's
    // margin box, so putting mt-0.5 on the Badge left this misaligned with
    // the other badges. `inline-flex items-center` on the Link matters too,
    // not just cosmetic: without it the Badge sits in the Link's inline
    // formatting context and is centered by `vertical-align: middle`, which
    // is baseline-relative, not geometric — inside this row's `<h1>` (a much
    // larger font-size than the badge's own), that baseline offset is
    // visibly asymmetric. Making the Link itself a flex container centers
    // the Badge by flexbox geometry instead, matching its siblings exactly
    // regardless of the ambient heading font size.
    <Link
      href={`/schemas/${forkedFrom.pid}`}
      // Same z-10 reasoning as StapleImportBadge above.
      className="inline-flex items-center shrink-0 mt-0.5 tooltip tooltip-bottom z-10 before:max-w-xs cursor-pointer"
      data-tip={`Forked from ${forkedFrom.title}`}
    >
      <Badge variant="secondary" outline>
        Forked
      </Badge>
    </Link>
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
  forkedFrom,
  role,
  isPendingInvite,
  viewerUserId,
  collaboration,
  onClone,
  isCloning,
  onRestore,
  isRestoring,
}: SchemaDetailHeaderProps) {
  const isOwner = role === "OWNER";
  // Restore-as-draft, cloning, and the checkpoint/save flow behind "Edit
  // Structure" are all ordinary content edits — EDITOR gets the same access
  // as OWNER for these (docs/refactor/form-collaboration.md §4.6).
  const canEdit = canEditForm({ role, isPendingInvite });
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
  // Mutually exclusive (see the ForkedBadgeProps comment above) — at most
  // one of the two ever renders.
  const provenanceBadge = stapleBadge ?? (forkedFrom ? <ForkedBadge forkedFrom={forkedFrom} /> : null);

  if (archived) {
    // No collaboration controls here: archived shared forms are never
    // reachable by a collaborator at all (docs/refactor/
    // form-collaboration.md §4.3), and every write action underneath this
    // modal is OWNER-only-and-archived-blocked anyway, so there's nothing
    // for it to do while archived.
    return (
      <PageHeader title={<SchemaHeaderTitle version={version} extraBadges={provenanceBadge} />}>
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
    <>
      {/* The collaborator avatar stack deliberately isn't part of this
          title-row badge cluster (docs/refactor/form-collaboration.md §6
          item 4) — badges (version/status/provenance) are one visual
          language and read as a group regardless of which row they're on,
          while avatars are a different one entirely; mixing them, even
          across two rows, still looked like visual noise. It gets its own
          row below instead, which is also where the PID used to live before
          moving into the Published badge's tooltip above. `PageHeader`'s own
          margin is zeroed out below — the page already provides spacing to
          the next section (UserSchemaDetailsClient's `mt-8` on the cards
          block), so keeping PageHeader's default `mb-6` (or any nonzero
          value) here would stack on top of that instead of replacing it. */}
      <PageHeader
        className="mb-0"
        title={<SchemaHeaderTitle version={version} extraBadges={provenanceBadge} />}
      >
        <div className="flex gap-2 items-center">
          {!isViewingLatest && canEdit && (
            <Button variant="primary" size="sm" onClick={onRestore} disabled={isRestoring}>
              {isRestoring ? "Restoring..." : "Restore as New Draft"}
            </Button>
          )}
          {/* No VIEWER path into /edit: the underlying @staple-verse/form-studio
              builder UI (FormStudioUI) has no read-only mode of its own — only
              the separate rendered-form preview (JsonSchemaForm) does — so a
              VIEWER's read access to the structure stays on this page, via
              SchemaViewerCard's JSON Source / Preview tabs below, rather than a
              half-real "view-only" builder. */}
          {isViewingLatest && !isPublished && canEdit && (
            <>
              <Link href={`/collection/${formId}/edit`}>
                <Button variant="primary" outline size="sm">
                  Edit Structure
                </Button>
              </Link>
              {isOwner && (
                <Link href={`/collection/${formId}/publish`}>
                  <Button variant="primary" size="sm">
                    Publish Schema
                  </Button>
                </Link>
              )}
            </>
          )}
          {/* Independent of isViewingLatest — a family can have several
              published versions (see docs/refactor/explore.md §7's version
              history), and an older, non-latest version can be published too.
              Previously nested under isViewingLatest, which hid this for any
              published version that wasn't also the latest. */}
          {isPublished && pid && (
            <Link href={`/schemas/${pid}`}>
              <Button variant="secondary" size="sm">
                View Public URL
              </Button>
            </Link>
          )}
          {/* Secondary/occasional actions — kept out of the primary row so it
              doesn't grow with every action a form can support. VIEWER gets no
              items here at all (clone needs EDITOR+, update-from-STAPLE and
              archive are OWNER-only), so the whole menu is gated on canEdit
              rather than leaving an empty dropdown trigger. */}
          {canEdit && (
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
              {isViewingLatest && stapleImport && isOwner && (
                <DropdownItem>
                  <UpdateFromStapleButton formId={formId} />
                </DropdownItem>
              )}
              {isOwner && (
                <DropdownItem>
                  <ArchiveFormButton
                    formId={formId}
                    schemaTitle={schemaTitle}
                    hasPublishedVersion={hasPublishedVersion}
                    className="w-full justify-start"
                  />
                </DropdownItem>
              )}
            </ActionMenu>
          )}
        </div>
      </PageHeader>
      {/* Small left offset so this row doesn't visually align flush with the
          title's own left edge — reads as its own distinct element below the
          header rather than a continuation of the title column. mt-2 is the
          only spacing between this and the header above (PageHeader itself
          contributes none, see above); nothing added below this row either —
          the next section's own top spacing handles that, unchanged. */}
      {/* Never rendered for a pending invitee: `collaboration` is `null` for
          them (see page.tsx), and even if it weren't, they aren't a member
          yet — showing them the collaborator list or a management modal
          they can't meaningfully act on doesn't make sense until they've
          accepted. */}
      {!isPendingInvite && collaboration && (
        <div className="pl-4 mt-2">
          <CollaborationHeaderControls
            formId={formId}
            viewerRole={role}
            viewerUserId={viewerUserId}
            collaboration={collaboration}
          />
        </div>
      )}
    </>
  );
}
