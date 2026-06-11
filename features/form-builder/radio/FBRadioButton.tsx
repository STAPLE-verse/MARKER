import React, { useState, ReactElement } from "react"
import classnames from "classnames"

type Props = {
  label: ReactElement | string
  value?: any
  name?: string
  checked?: boolean
  required?: boolean
  disabled?: boolean
  autoFocus?: boolean
  onChange: (selection: string) => void
}

export default function FBRadioButton(props: Props): ReactElement {
  const { label, value, checked, name, onChange, required, disabled, autoFocus } = props
  const id = React.useId()
  const classes = classnames("form-control w-full", { disabled })
  return (
    <div className={classes} key={value}>
      <label htmlFor={id} className="label cursor-pointer justify-start gap-3">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={() => onChange(value)}
          className="radio radio-primary radio-sm"
        />
        <span className="label-text text-base">{label}</span>
      </label>
    </div>
  )
}
