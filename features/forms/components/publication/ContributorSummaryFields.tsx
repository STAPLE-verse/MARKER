import { Badge } from "@/components/ui/Badge"
import { contributorRoleLabel } from "@/features/forms/constants/publicationMetadataOptions"
import { sortRoles } from "@/features/forms/utils/publicationMetadata"
import type { ContributorAffiliationDTO } from "@/features/forms/types"

export interface ContributorSummaryFieldsProps {
  name: string
  nameFallback: string
  roles: string[]
  orcid: string | null | undefined
  affiliations?: ContributorAffiliationDTO[]
}

/**
 * The Name/Roles/ORCID/Affiliation block shared by the editable contributor
 * row and the read-only publication-metadata display — same fields, same
 * labels, same role sorting/labeling, so the two never drift out of sync
 * with each other again (they already had once: only the display version
 * ran role values through `contributorRoleLabel`).
 */
export function ContributorSummaryFields({
  name,
  nameFallback,
  roles,
  orcid,
  affiliations,
}: ContributorSummaryFieldsProps) {
  const sortedRoles = sortRoles(roles)

  return (
    <>
      <div className="flex-1 min-w-[140px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Name</p>
        <p className="font-medium">{name || nameFallback}</p>
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Roles</p>
        {sortedRoles.length === 0 ? (
          <p className="text-sm text-base-content/60 mt-0.5">Not specified</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {sortedRoles.map((role) => (
              <Badge key={role} variant="secondary" outline size="sm">
                {contributorRoleLabel(role)}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">ORCID</p>
        <p className="font-medium">{orcid || "Not specified"}</p>
      </div>
      {affiliations && affiliations.length > 0 && (
        <div className="flex-1 min-w-[140px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Affiliation</p>
          <p className="font-medium">{affiliations.map((affiliation) => affiliation.name).join(", ")}</p>
        </div>
      )}
    </>
  )
}
