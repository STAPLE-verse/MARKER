"use client";

import { useState } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SchemaTabsCard } from "@/features/forms/components/SchemaTabsCard";
import { useImportFromStaple } from "@/features/forms/hooks/useImportFromStaple";
import { useStapleVersionPreview } from "@/features/forms/hooks/useStapleVersionPreview";
import type { StapleImportFormDTO } from "@/features/forms/imports/queries/getStapleImportOptions";
import { toast } from "@/lib/toast";

interface StapleImportModalProps {
  form: StapleImportFormDTO;
  open: boolean;
  onClose: () => void;
  /**
   * True when opened from a specific MarkerForm's own "Update from STAPLE"
   * button — `getStapleSourceForUpdate` always returns exactly one target,
   * that form itself. Locks the flow to update mode and hides both the
   * create/update choice and the target picker: "create a new form" and
   * "which target" are both nonsensical questions here, since the answer to
   * the latter is always "this one."
   */
  updateOnly?: boolean;
}

/**
 * Opened either per-row from StapleImportTable (the generic picker, where
 * create-vs-update and target both need to be chosen) or from a single
 * form's "Update from STAPLE" button (`updateOnly` — see above). Hosts the
 * version picker, the overwrite confirmation for a modified update target,
 * and a live SchemaTabsCard preview of the currently-selected STAPLE version.
 */
export function StapleImportModal({ form, open, onClose, updateOnly = false }: StapleImportModalProps) {
  const [versionId, setVersionId] = useState(form.versions[0]?.id);
  const [mode, setMode] = useState<"create" | "update">(
    updateOnly || form.markerTargets.length > 0 ? "update" : "create"
  );
  const [targetId, setTargetId] = useState(form.markerTargets[0]?.id);
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
  const showModeChoice = !updateOnly && form.markerTargets.length > 0;
  const showTargetSelect = !updateOnly && mode === "update" && form.markerTargets.length > 0;

  const { preview, isLoadingPreview } = useStapleVersionPreview(form.id, versionId);
  const { doImport, isImporting } = useImportFromStaple();

  const selectedTarget = form.markerTargets.find((target) => target.id === targetId);

  const submitImport = (confirmOverwrite: boolean) => {
    if (!versionId || (mode === "update" && !targetId)) return;

    const input =
      mode === "create"
        ? { mode: "create" as const, sourceFormId: form.id, sourceVersionId: versionId }
        : {
            mode: "update" as const,
            sourceFormId: form.id,
            sourceVersionId: versionId,
            targetMarkerFormId: targetId!,
            confirmOverwrite,
          };

    doImport(input, (message) => toast.error(message));
  };

  const handleImport = () => {
    if (!versionId || (mode === "update" && !targetId)) return;

    // Interjects the same styled ConfirmDialog Archive/Delete already use,
    // pre-empting the server-side check in importFromStaple.
    if (mode === "update" && selectedTarget?.modificationStatus === "MODIFIED") {
      setConfirmOverwriteOpen(true);
      return;
    }

    submitImport(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Import "${form.latestName}"`} size="xl">
      <div className="space-y-6 mt-4">
        <div className="form-control w-full">
          <label className="label pb-2">
            <span className="label-text font-medium inline-flex items-center gap-1.5">
              STAPLE version
              <InfoTooltip text="This creates an independent snapshot in MARKER — it does not stay in sync with STAPLE." />
            </span>
          </label>
          <select
            className="select select-bordered w-full"
            value={versionId}
            onChange={(e) => setVersionId(Number(e.target.value))}
          >
            {form.versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.version} — {version.name} ({new Date(version.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {showModeChoice && (
          <div className="flex gap-6">
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-sm"
                checked={mode === "create"}
                onChange={() => setMode("create")}
              />
              Create a new MARKER form
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-sm"
                checked={mode === "update"}
                onChange={() => setMode("update")}
              />
              Update an existing MARKER copy
            </label>
          </div>
        )}

        {showTargetSelect && (
          <select
            className="select select-bordered w-full"
            value={targetId}
            onChange={(e) => setTargetId(Number(e.target.value))}
          >
            {form.markerTargets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.latestName} (v{target.latestVersion})
                {target.modificationStatus === "MODIFIED" ? " — has local changes since last import" : ""}
              </option>
            ))}
          </select>
        )}

        {isLoadingPreview && <div className="text-sm text-base-content/50">Loading preview…</div>}
        {preview && <SchemaTabsCard schema={preview.schema} uiSchema={preview.uiSchema} />}
      </div>

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={isImporting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={isImporting || !versionId || (mode === "update" && !targetId)}
        >
          {isImporting ? "Importing..." : "Import"}
        </Button>
      </ModalActions>

      <ConfirmDialog
        open={confirmOverwriteOpen}
        onClose={() => setConfirmOverwriteOpen(false)}
        title="Overwrite local changes?"
        body={
          <p className="text-base-content/85">
            <span className="font-bold text-primary">{selectedTarget?.latestName}</span> has
            changes made in MARKER since the last import. Importing now will replace them with
            the STAPLE version.
          </p>
        }
        confirmLabel="Import Anyway"
        pendingLabel="Importing..."
        confirmVariant="primary"
        isPending={isImporting}
        onConfirm={() => {
          setConfirmOverwriteOpen(false);
          submitImport(true);
        }}
      />
    </Modal>
  );
}
