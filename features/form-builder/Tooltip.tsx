/* eslint react/no-multi-comp: 0, react/prop-types: 0 */
import React, { ReactElement } from "react"
import { InformationCircleIcon, StarIcon } from "@heroicons/react/24/outline"

const typeMap = {
  alert: StarIcon,
  help: InformationCircleIcon,
}

export default function Tooltip({
  text,
  type,
  id,
}: {
  text: string
  type: "alert" | "help"
  id: string
}): ReactElement {
  const Icon = typeMap[type]

  return (
    <span className="tooltip tooltip-right tooltip-info z-50 before:max-w-xs" data-tip={text} id={id}>
      <Icon className="h-4 w-4 inline stroke-2 stroke-info" />
    </span>
  )
}
