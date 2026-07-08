import React, { useState, ReactElement } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import Tooltip from "../Tooltip"
import CardSelector from "./CardSelector"
import ValueSelector from "./ValueSelector"
import { getRandomId } from "../utils"
import { fieldClass, fieldLabelClass, fieldStackClass } from "../fieldLayout"

// a possible dependency
export default function DependencyPossibility({
  possibility,
  neighborNames,
  onChange,
  onDelete,
  parentEnums,
  parentType,
  parentName,
  parentSchema,
}: {
  possibility: {
    children: Array<string>
    value?: any
  }
  neighborNames: Array<string>
  onChange: (newPossibility: { children: Array<string>; value?: any }) => void
  onDelete: () => void
  parentEnums?: Array<string | number>
  parentType?: string
  parentName?: string
  parentSchema?: any
}): ReactElement {
  const [elementId] = useState(getRandomId())
  return (
    <div className={`form-dependency-condition relative rounded-box border border-primary p-4 ${fieldStackClass}`}>
      <div className={fieldClass}>
        <div className={`${fieldLabelClass} flex items-center gap-2`}>
          Display the following:
          <Tooltip
            id={`${elementId}_bulk`}
            type="help"
            text="Choose the other form items for the dependency"
          />
        </div>
        <CardSelector
          possibleChoices={neighborNames.filter((name) => name !== parentName) || []}
          chosenChoices={possibility.children}
          onChange={(chosenChoices: Array<string>) =>
            onChange({ ...possibility, children: [...chosenChoices] })
          }
          placeholder="Choose a dependent..."
        />
      </div>
      <div className={fieldClass}>
        <div className={fieldLabelClass}>
          If &quot;{parentName}&quot; has {possibility.value ? "the value:" : "a value."}
        </div>
        <div style={{ display: possibility.value ? "block" : "none" }}>
          <ValueSelector
            possibility={possibility}
            onChange={(newPossibility: { children: Array<string>; value?: any }) =>
              onChange(newPossibility)
            }
            parentEnums={parentEnums}
            parentType={parentType}
            parentName={parentName}
            parentSchema={parentSchema}
          />
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <span className="tooltip tooltip-left tooltip-info z-50 before:max-w-xs cursor-pointer" data-tip="Delete this dependency">
          <XMarkIcon className="h-6 w-6 stroke-warning hover:stroke-error transition-colors" strokeWidth={2} onClick={() => onDelete()} />
        </span>
      </div>
    </div>
  )
}
