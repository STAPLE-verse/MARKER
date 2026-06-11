import React, { useState, ReactElement } from "react"
import { getRandomId } from "../utils"
import { XMarkIcon } from "@heroicons/react/24/outline"

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
      <ul>
        {chosenChoices.map((chosenChoice, index) => (
          <li key={`${elementId}_neighbor_${index}`}>
            {chosenChoice}{" "}
            <XMarkIcon
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
        className="select select-bordered w-full mt-2 mb-2 text-primary border-primary border-2 bg-primary-content"
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
