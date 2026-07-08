import React, { ReactElement } from "react"
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline"

interface CardEnumOptionsProps {
  initialValues: Array<any>
  names?: Array<string>
  showNames: boolean
  onChange: (newEnums: Array<any>, newEnumNames?: Array<string>) => void
  type: string
}

// Input field corresponding to an array of values, add and remove
export default function CardEnumOptions({
  initialValues,
  names,
  showNames,
  onChange,
  type,
}: CardEnumOptionsProps): ReactElement {
  const possibleValues = initialValues.map((value, index) => {
    let name = `${value}`
    if (names && index < names.length) name = names[index] ?? ""
    return (
      //@ts-ignore
      <div key={index} className="flex items-center gap-2 mb-2">
        <input
          value={value === undefined || value === null ? "" : value}
          placeholder="Stored Value"
          key={`val-${index}`}
          type={type === "string" ? "text" : "number"}
          onChange={(ev: any) => {
            let newVal
            switch (type) {
              case "string":
                newVal = ev.target.value
                break
              case "number":
              case "integer":
                newVal = parseFloat(ev.target.value)
                if (Number.isInteger(newVal)) newVal = parseInt(ev.target.value, 10)
                // TODO: Possible unused condition, since we know it is a number or integer in this case.
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (Number.isNaN(newVal)) newVal = type === "string" ? "" : 0
                break
              default:
                throw new Error(`Enum called with unknown type ${type}`)
            }
            onChange(
              [...initialValues.slice(0, index), newVal, ...initialValues.slice(index + 1)],
              names
            )
          }}
          className="input input-primary input-bordered input-sm w-full"
        />
        <input
          value={name || ""}
          placeholder="Label"
          key={`name-${index}`}
          type="text"
          onChange={(ev: any) => {
            if (names)
              onChange(initialValues, [
                ...names.slice(0, index),
                ev.target.value,
                ...names.slice(index + 1),
              ])
          }}
          className="input input-primary input-bordered input-sm w-full"
          style={{ display: showNames ? "initial" : "none" }}
        />
        <span
          className="cursor-pointer"
          onClick={() => {
            // remove this value
            onChange(
              [...initialValues.slice(0, index), ...initialValues.slice(index + 1)],
              names ? [...names.slice(0, index), ...names.slice(index + 1)] : undefined
            )
          }}
        >
          <XMarkIcon className="h-5 w-5 stroke-warning hover:stroke-error transition-colors" />
        </span>
      </div>
    )
  })

  return (
    <React.Fragment>
      {possibleValues}
      <span
        className="tooltip tooltip-right tooltip-info z-50 before:max-w-xs mt-2 inline-flex cursor-pointer"
        data-tip="Add new possible option"
        onClick={() => {
          // add a new dropdown option
          onChange(
            [...initialValues, type === "string" ? "" : 0],
            names ? [...names, ""] : undefined
          )
        }}
      >
        <PlusIcon
          className="h-6 w-6 stroke-secondary transition-colors hover:stroke-primary"
          strokeWidth={4}
        />
      </span>
    </React.Fragment>
  )
}
