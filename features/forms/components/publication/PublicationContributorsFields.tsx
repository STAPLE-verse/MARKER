import { useEffect, useMemo, useState } from "react"
import {
  ArrayPath,
  Control,
  FieldErrors,
  FieldValues,
  Path,
  useFieldArray,
  useWatch,
} from "react-hook-form"
import { PencilIcon, PlusIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/outline"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Input } from "@/components/ui/Input"
import { Modal, ModalActions } from "@/components/ui/Modal"
import { TextListInput } from "@/components/ui/TextListInput"
import { ContributorSummaryFields } from "@/features/forms/components/publication/ContributorSummaryFields"
import {
  assembleContributorName,
  availableContributorRoles,
  sortRoles,
} from "@/features/forms/utils/publicationMetadata"
import { strictPublicationContributorSchema } from "@/features/forms/schemas"
import type { ContributorAffiliationDTO } from "@/features/forms/types"
import { runAction } from "@/lib/action"
import { getFormContributorSuggestions } from "@/features/forms/collaborators/actions/getFormContributorSuggestions"
import type { ContributorSuggestionDTO } from "@/features/forms/collaborators/types"

interface ContributorFormValues {
  name: string
  nameType: "Personal" | "Organizational"
  givenName: string
  familyName: string
  roles: string[]
  orcid: string
  affiliations: ContributorAffiliationDTO[]
}

const BLANK_CONTRIBUTOR: ContributorFormValues = {
  name: "",
  nameType: "Personal",
  givenName: "",
  familyName: "",
  roles: [],
  orcid: "",
  affiliations: [],
}

// FieldArrayWithId's generic shape doesn't structurally overlap with a
// concrete ContributorFormValues, so a cast is unavoidable here — centralized
// in this one helper rather than repeated at every call site.
function toContributorFormValues(field: unknown): ContributorFormValues {
  return { ...BLANK_CONTRIBUTOR, ...(field as unknown as ContributorFormValues) }
}

interface WatchedContributor {
  roles?: string[]
  name?: string
  orcid?: string | null
}

interface PublicationContributorsFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
  isProfileIncomplete?: boolean
  /** Feeds the collaborator contributor-suggestion chips (docs/refactor/form-collaboration.md §4.7); omit to skip fetching suggestions entirely. */
  formId?: number
}

export function PublicationContributorsFields<TFieldValues extends FieldValues>({
  control,
  errors,
  isProfileIncomplete,
  formId,
}: PublicationContributorsFieldsProps<TFieldValues>) {
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "contributors" as ArrayPath<TFieldValues>,
  })
  const contributorErrors = errors.contributors as
    | ({ message?: string; name?: { message?: string }; roles?: { message?: string } }[] & { message?: string })
    | undefined

  const watchedContributors =
    (useWatch({ control, name: "contributors" as Path<TFieldValues> }) as WatchedContributor[] | undefined) ?? []

  // null = closed, -1 = adding a new contributor, >= 0 = editing that index.
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [suggestions, setSuggestions] = useState<ContributorSuggestionDTO[]>([])

  useEffect(() => {
    if (formId === undefined) return
    let cancelled = false
    runAction(getFormContributorSuggestions({ formId })).then((res) => {
      if (!cancelled && res.ok) setSuggestions(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [formId])

  // Excludes anyone already in the (still-unsaved) contributor list, by
  // ORCID when the suggestion has one, else by exact name — the same check
  // a person would eyeball manually, automated (docs/refactor/
  // form-collaboration.md §4.7).
  const unusedSuggestions = suggestions.filter(
    (s) =>
      !watchedContributors.some((c) =>
        s.orcid ? c.orcid === s.orcid : c.name?.trim().toLowerCase() === s.name.trim().toLowerCase()
      )
  )

  const addSuggestion = (suggestion: ContributorSuggestionDTO) => {
    append({
      name: suggestion.name,
      nameType: "Personal",
      givenName: suggestion.givenName ?? "",
      familyName: suggestion.familyName ?? "",
      // Unlike the owner/creator auto-seed, don't default a role like
      // "Creator" here — editing access doesn't imply a specific
      // attribution role, so the user picks one via the edit modal.
      roles: [],
      orcid: suggestion.orcid ?? "",
      affiliations: suggestion.affiliations,
    } as never)
  }

  const editingContributor: ContributorFormValues =
    editingIndex !== null && editingIndex >= 0
      ? toContributorFormValues(fields[editingIndex])
      : BLANK_CONTRIBUTOR

  return (
    <div className="space-y-4">
      {isProfileIncomplete && (
        <Alert variant="warning" title="Incomplete Profile">
          Your profile is missing some details (like your name or ORCID). We recommend updating your account settings to automatically pre-fill this information in the future.
        </Alert>
      )}

      {fields.length === 0 ? (
        <p className="text-sm text-base-content/60 text-center py-4">No contributors added yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const contributor = toContributorFormValues(field)
            const nameError = contributorErrors?.[index]?.name?.message
            const rolesError = contributorErrors?.[index]?.roles?.message
            const rowError = nameError ?? rolesError

            return (
              <div
                key={field.id}
                className={`flex items-start justify-between gap-4 bg-base-200/50 p-4 rounded-xl border ${
                  rowError ? "border-error" : "border-base-300"
                }`}
              >
                <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1.5">
                  <ContributorSummaryFields
                    name={contributor.name}
                    nameFallback="Unnamed contributor"
                    roles={contributor.roles}
                    orcid={contributor.orcid}
                    affiliations={contributor.affiliations}
                  />
                  {rowError && <p className="text-error text-sm w-full">{rowError}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(index)}
                    title="Edit Contributor"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-error hover:bg-error/10"
                    size="sm"
                    onClick={() => remove(index)}
                    title="Remove Contributor"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 justify-center pt-2">
          <span className="text-xs text-base-content/60">Add from this form&apos;s collaborators:</span>
          {unusedSuggestions.map((suggestion) => (
            <Button
              key={suggestion.userId}
              type="button"
              variant="ghost"
              size="sm"
              className="border border-dashed border-base-300"
              onClick={() => addSuggestion(suggestion)}
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              {suggestion.name}
            </Button>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button type="button" variant="secondary" outline size="sm" onClick={() => setEditingIndex(-1)}>
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Contributor
        </Button>
      </div>
      {typeof contributorErrors?.message === "string" && (
        <p className="text-error text-sm text-center mt-2">{contributorErrors.message}</p>
      )}

      {editingIndex !== null && (
        <ContributorEditorModal
          initial={editingContributor}
          contributors={watchedContributors}
          nameError={editingIndex >= 0 ? contributorErrors?.[editingIndex]?.name?.message : undefined}
          rolesError={editingIndex >= 0 ? contributorErrors?.[editingIndex]?.roles?.message : undefined}
          onClose={() => setEditingIndex(null)}
          onSave={(values) => {
            if (editingIndex === -1) {
              append(values as never)
            } else {
              update(editingIndex, values as never)
            }
            setEditingIndex(null)
          }}
        />
      )}
    </div>
  )
}

interface ContributorEditorModalProps {
  initial: ContributorFormValues
  contributors: WatchedContributor[]
  nameError?: string
  rolesError?: string
  onSave: (values: ContributorFormValues) => void
  onClose: () => void
}

function ContributorEditorModal({
  initial,
  contributors,
  nameError: externalNameError,
  rolesError: externalRolesError,
  onSave,
  onClose,
}: ContributorEditorModalProps) {
  const [values, setValues] = useState<ContributorFormValues>(initial)
  const [customRole, setCustomRole] = useState("")
  // Populated only by this modal's own save-time check below — distinct from
  // the externally-passed nameError/rolesError, which reflect the *previous*
  // wizard-level submit/step-trigger result for an already-committed
  // contributor. This is the primary gate: it runs on every Save attempt,
  // before anything is committed to the field array.
  const [saveErrors, setSaveErrors] = useState<{ name?: string; roles?: string; orcid?: string }>({})

  const updateField = <K extends keyof ContributorFormValues>(key: K, value: ContributorFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const toggleRole = (role: string) => {
    setValues((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }))
  }

  const addCustomRole = () => {
    const trimmed = customRole.trim()
    if (!trimmed) return
    setValues((prev) => (prev.roles.includes(trimmed) ? prev : { ...prev, roles: [...prev.roles, trimmed] }))
    setCustomRole("")
  }

  // The one place this union is computed: fixed options + roles already used
  // elsewhere on the form + roles picked in this still-unsaved contributor.
  const roleChecklist = useMemo(
    () => sortRoles(availableContributorRoles(contributors, values.roles)),
    [contributors, values.roles]
  )

  const handleSave = () => {
    const trimmedGivenName = values.nameType === "Personal" ? values.givenName.trim() : ""
    const trimmedFamilyName = values.nameType === "Personal" ? values.familyName.trim() : ""

    const assembled = {
      ...values,
      name: assembleContributorName({
        nameType: values.nameType,
        name: values.name,
        givenName: trimmedGivenName,
        familyName: trimmedFamilyName,
      }),
      givenName: trimmedGivenName,
      familyName: trimmedFamilyName,
      orcid: values.orcid.trim(),
      affiliations: values.affiliations
        .map((affiliation) => affiliation.name.trim())
        .filter((name) => name.length > 0)
        .map((name) => ({ name })),
    }

    // Same schema the server enforces (strictPublicationContributorSchema) —
    // reused here rather than hand-rolled, so this can never drift from what
    // actually gets checked at publish time.
    const result = strictPublicationContributorSchema.safeParse(assembled)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setSaveErrors({ name: fieldErrors.name?.[0], roles: fieldErrors.roles?.[0], orcid: fieldErrors.orcid?.[0] })
      return
    }

    setSaveErrors({})
    onSave(assembled)
  }

  const nameError = saveErrors.name ?? externalNameError
  const rolesError = saveErrors.roles ?? externalRolesError
  const orcidError = saveErrors.orcid

  return (
    <Modal open onClose={onClose} title="Edit Contributor" size="lg">
      <div className="space-y-5 py-2">
        <div className="flex gap-6">
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              className="radio radio-primary radio-sm"
              checked={values.nameType === "Personal"}
              onChange={() => updateField("nameType", "Personal")}
            />
            <span className="label-text">Person</span>
          </label>
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              className="radio radio-primary radio-sm"
              checked={values.nameType === "Organizational"}
              onChange={() => updateField("nameType", "Organizational")}
            />
            <span className="label-text">Organization</span>
          </label>
        </div>

        {values.nameType === "Personal" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Given Name"
              placeholder="Jane"
              value={values.givenName}
              onChange={(e) => updateField("givenName", e.target.value)}
            />
            <Input
              label="Family Name"
              placeholder="Doe"
              value={values.familyName}
              onChange={(e) => updateField("familyName", e.target.value)}
            />
          </div>
        ) : (
          <Input
            label="Organization Name"
            placeholder="Acme Research Institute"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        )}
        {nameError && <p className="text-error text-sm">{nameError}</p>}

        <Input
          label="ORCID (Optional)"
          placeholder="0000-0000-0000-0000"
          value={values.orcid}
          onChange={(e) => updateField("orcid", e.target.value)}
          error={orcidError}
        />

        <TextListInput
          label="Affiliations (Optional)"
          placeholder="University or institution name"
          addButtonLabel="Add Affiliation"
          value={values.affiliations.map((affiliation) => affiliation.name)}
          onChange={(names) => updateField("affiliations", names.map((name) => ({ name })))}
        />

        <div className="form-control w-full">
          <label className="label pb-2">
            <span className="label-text font-medium">Roles</span>
          </label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {roleChecklist.map((role) => (
              <Checkbox
                key={role}
                label={role}
                className="checkbox-primary"
                checked={values.roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a custom role"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCustomRole()
                }
              }}
            />
            <Button type="button" variant="secondary" outline onClick={addCustomRole}>
              Add
            </Button>
          </div>
          {rolesError && <p className="text-error text-sm mt-1">{rolesError}</p>}
        </div>
      </div>

      <ModalActions>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleSave}>
          Save
        </Button>
      </ModalActions>
    </Modal>
  )
}
