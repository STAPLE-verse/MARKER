import { notFound } from "next/navigation"
import { requirePageAuth } from "@/utils/auth"
import { getFormById } from "./getFormById"
import { FormDetailDTO } from "../types"

/**
 * Shared page loader for owned-form routes (`/collection/[id]`, `.../edit`, `.../publish`).
 *
 * Centralizes the auth check, id parsing, ownership lookup, and not-found handling
 * that every owned-form page needs, so individual pages stay declarative.
 * Throws Next's `notFound()` when the id is invalid or the form is missing/unowned.
 */
export async function loadOwnedForm(
  idParam: string
): Promise<{ userId: number; form: FormDetailDTO }> {
  const { userId } = await requirePageAuth()

  const formId = parseInt(idParam, 10)
  if (isNaN(formId)) notFound()

  const form = await getFormById(formId, userId)
  if (!form || form.versions.length === 0) notFound()

  return { userId, form }
}
