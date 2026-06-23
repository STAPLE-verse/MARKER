import { useState } from "react";
import { FormDetailDTO, FormVersionDTO } from "@/features/forms/types";

/**
 * Owns the "which version am I looking at" state for a form detail view.
 *
 * Versions are ordered newest-first, so `versions[0]` is always the latest.
 * Defaults the selection to the latest version and exposes whether the user is
 * currently viewing it (used to gate edit/publish actions).
 */
export function useVersionSelection(form: FormDetailDTO) {
  const latestVersion = form.versions[0];
  const [selectedVersion, selectVersion] = useState<FormVersionDTO>(latestVersion);

  const isViewingLatest = selectedVersion.id === latestVersion.id;

  return { selectedVersion, selectVersion, isViewingLatest, latestVersion };
}
