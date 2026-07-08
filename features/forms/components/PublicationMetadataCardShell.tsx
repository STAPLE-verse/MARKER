import { ReactNode } from "react"
import { Card, CardBody, CardTitle } from "@/components/ui/Card"
import { CollapsibleCard } from "@/components/ui/CollapsibleCard"

interface PublicationMetadataCardShellProps {
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}

const title = "Publication Metadata"

export function PublicationMetadataCardShell({
  children,
  collapsible = true,
  defaultOpen = true,
}: PublicationMetadataCardShellProps) {
  if (collapsible) {
    return (
      <CollapsibleCard
        bordered
        defaultOpen={defaultOpen}
        title={
          <h2 className="w-full text-xl font-bold border-b border-base-200 pb-2">
            {title}
          </h2>
        }
        titleClassName="px-8 pt-8 pb-4"
        contentClassName="px-8 pt-0 pb-8"
      >
        {children}
      </CollapsibleCard>
    )
  }

  return (
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">
          {title}
        </CardTitle>
        {children}
      </CardBody>
    </Card>
  )
}
