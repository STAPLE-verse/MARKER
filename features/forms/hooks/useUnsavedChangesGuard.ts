import { useEffect } from "react";

/**
 * Warns before the user closes or refreshes the tab when the editor differs
 * from the last DB save (architecture.md §8.11.5).
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}

export function confirmLeaveWithUnsavedChanges(isDirty: boolean): boolean {
  if (!isDirty) return true;
  return window.confirm(
    "You have unsaved changes that are not saved to your collection. Leave without saving?"
  );
}
