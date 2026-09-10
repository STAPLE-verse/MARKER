"use client";

import { Button } from "@/components/ui/Button";
import { StapleImportModal } from "@/features/forms/components/add/StapleImportModal";
import { useStapleSourceForUpdate } from "@/features/forms/hooks/useStapleSourceForUpdate";

interface UpdateFromStapleButtonProps {
  formId: number;
}

/**
 * Detail-page entry point into the same StapleImportModal the add-schema
 * picker uses, scoped to this one already-imported form (its `markerTargets`
 * contains only itself — see getStapleSourceForUpdate). Lives inside
 * SchemaDetailHeader's ActionMenu, so it's styled to read as a menu row
 * (ghost, full-width, left-aligned) rather than a standalone button.
 */
export function UpdateFromStapleButton({ formId }: UpdateFromStapleButtonProps) {
  const { source, open, close, isLoading } = useStapleSourceForUpdate();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        disabled={isLoading}
        onClick={() => open(formId)}
      >
        {isLoading ? "Checking STAPLE..." : "Update from STAPLE"}
      </Button>
      {source && <StapleImportModal form={source} open onClose={close} updateOnly />}
    </>
  );
}
