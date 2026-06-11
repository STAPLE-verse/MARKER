import React, { FC } from "react"
import classnames from "classnames"

interface FBCheckboxProps {
  onChangeValue: (_arg0: { [key: string]: any }) => void
  isChecked: boolean
  id?: string
  label?: string
  use?: string
  value?: string
  disabled?: boolean
  dataTest?: string
  labelClassName?: string
}

const FBCheckbox: FC<FBCheckboxProps> = ({
  onChangeValue,
  value = "",
  isChecked = false,
  label = "",
  use = "action",
  disabled = false,
  id = "",
  dataTest = "",
  labelClassName = "",
}) => {
  const classes = classnames("fb-checkbox", {
    "edit-checkbox": !disabled && use === "edit",
    "action-checkbox": !disabled && use === "action",
    "disabled-checked-checkbox": disabled && isChecked,
    "disabled-unchecked-checkbox": disabled && !isChecked,
  })
  const potentialCheckboxId = id !== "" ? id : label
  const checkboxId = potentialCheckboxId !== "" ? potentialCheckboxId : undefined
  return (
    <div data-test="checkbox" className="form-control">
      <label htmlFor={checkboxId} className={`label cursor-pointer justify-start gap-3 ${labelClassName || ""}`}>
        <input
          type="checkbox"
          id={checkboxId}
          data-test={dataTest || undefined}
          onChange={(event) => {
            if (!disabled) {
              onChangeValue(event)
            }
          }}
          value={value}
          disabled={disabled}
          checked={isChecked}
          className={classnames("checkbox checkbox-primary", {
            "checkbox-disabled": disabled
          })}
        />
        {label && <span className="label-text text-base">{label}</span>}
      </label>
    </div>
  )
}

export default FBCheckbox
