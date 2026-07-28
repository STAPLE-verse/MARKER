import type { ReactNode } from "react"
import { Badge } from "@/components/ui/Badge"
import {
  contributorRoleLabel,
  domainLabel,
  languageLabel,
  licenseLabel,
} from "@/features/forms/constants/publicationMetadataOptions"
import type { PublicationMetadataFieldsDTO } from "@/features/forms/types"

interface PublicationMetadataFieldsDisplayProps {
  metadata: PublicationMetadataFieldsDTO | null
  releaseNotes?: string | null
}

function FieldSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-1">
        {label}
      </h4>
      {children}
    </div>
  )
}

export function PublicationMetadataFieldsDisplay({
  metadata,
  releaseNotes,
}: PublicationMetadataFieldsDisplayProps) {
  const keywords = metadata?.keywords ?? []
  const contributors = metadata?.contributors ?? []
  const showReleaseNotes = releaseNotes !== undefined

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FieldSection label="License">
        <p className="font-medium">{licenseLabel(metadata?.license)}</p>
      </FieldSection>
      <FieldSection label="Domain">
        <p className="font-medium">{domainLabel(metadata?.domain)}</p>
      </FieldSection>
      <FieldSection label="Language">
        <p className="font-medium">{languageLabel(metadata?.language)}</p>
      </FieldSection>

      <div className="md:col-span-3 mt-2">
        <FieldSection label="Keywords">
          {keywords.length === 0 ? (
            <p className="text-base-content/60">None added</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" outline className="font-medium">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </FieldSection>
      </div>

      <div className="md:col-span-3 mt-2">
        <FieldSection label="Contributors">
          {contributors.length === 0 ? (
            <p className="text-base-content/60">None added</p>
          ) : (
            <div className="flex flex-col gap-3">
              {contributors.map((contributor, index) => (
                <div
                  key={`${contributor.name}-${contributor.role}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-lg border border-base-200 bg-base-100 p-3"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                      Name
                    </p>
                    <p className="font-medium">{contributor.name || "Unnamed"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                      Role
                    </p>
                    <p className="font-medium">{contributorRoleLabel(contributor.role)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                      ORCID
                    </p>
                    <p className="font-medium">{contributor.orcid || "Not specified"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FieldSection>
      </div>

      {showReleaseNotes && (
        <div className="md:col-span-3 mt-2">
          <FieldSection label="Release Notes">
            <p className="text-sm text-base-content/80 bg-base-200/50 p-3 rounded-lg border border-base-200 whitespace-pre-wrap">
              {releaseNotes?.trim() || "Not specified"}
            </p>
          </FieldSection>
        </div>
      )}
    </div>
  )
}
