import React, { useState, ReactElement } from "react"
import { getRandomId } from "../utils"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { fieldControlClass } from "../fieldLayout"

// a field that lets you choose adjacent blocks
export default function CardSelector({
  possibleChoices,
  chosenChoices,
  onChange,
  placeholder,
}: {
  possibleChoices: Array<string>
  chosenChoices: Array<string>
  onChange: (chosenChoices: Array<string>) => void
  placeholder: string
}): ReactElement {
  const [elementId] = useState(getRandomId())
  return (
    <React.Fragment>
      <ul className="flex flex-col gap-1">
        {chosenChoices.map((chosenChoice, index) => (
          <li key={`${elementId}_neighbor_${index}`} className="flex items-center gap-2">
            <span className="min-w-0 break-words">{chosenChoice}</span>
            <XMarkIcon
              className="h-5 w-5 shrink-0 cursor-pointer stroke-warning hover:stroke-error transition-colors"
              onClick={() =>
                onChange([...chosenChoices.slice(0, index), ...chosenChoices.slice(index + 1)])
              }
            />
          </li>
        ))}
      </ul>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) {
            onChange([...chosenChoices, e.target.value])
          }
        }}
        className={`select select-primary select-bordered select-sm ${fieldControlClass}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {possibleChoices
          .filter((choice) => !chosenChoices.includes(choice))
          .map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
      </select>
    </React.Fragment>
  )
}
