import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { archiveForm } from "@/features/forms/actions"
import { runAction } from "@/lib/action"
import { toast } from "@/lib/toast"

/**
 * Wraps the `archiveForm` server action. Surfaces a success/error toast and
 * refreshes the current route or navigates away (see docs/architecture.md §8.9).
 */
export function useArchiveForm(options?: {
  onSuccess?: () => void
  /** Navigate here after archive instead of refreshing the current route. */
  redirectTo?: string
}) {
  const router = useRouter()
  const [isArchiving, startArchiving] = useTransition()

  const archive = (formId: number) => {
    startArchiving(async () => {
      const res = await runAction(archiveForm({ formId }))
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Schema archived")
      if (options?.redirectTo) {
        router.push(options.redirectTo)
      } else {
        router.refresh()
      }
      options?.onSuccess?.()
    })
  }

  return { archive, isArchiving }
}
