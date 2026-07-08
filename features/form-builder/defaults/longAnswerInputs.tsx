import React, { useState } from "react"
import FBCheckbox from "../checkbox/FBCheckbox"
import Tooltip from "../Tooltip"
import { getRandomId } from "../utils"
import type { FormInput, CardComponentType } from "../types"
import { PlaceholderInput } from "../inputs/PlaceholderInput"
import { fieldClass, fieldControlClass, fieldLabelClass, fieldStackClass } from "../fieldLayout"

// specify the inputs required for a string type object
const CardLongAnswerParameterInputs: CardComponentType = ({ parameters, onChange }) => {
  const [elementId] = useState(getRandomId())
  return (
    <div className={fieldStackClass}>
      <div className={fieldClass}>
        <div className={fieldLabelClass}>Minimum Length</div>
        <input
          value={parameters.minLength ? parameters.minLength : ""}
          placeholder="Minimum Length"
          key="minLength"
          type="number"
          onChange={(ev) => {
            onChange({
              ...parameters,
              minLength: parseInt(ev.target.value, 10),
            })
          }}
          className={`input input-primary input-bordered input-sm ${fieldControlClass}`}
        />
      </div>
      <div className={fieldClass}>
        <div className={fieldLabelClass}>Maximum Length</div>
        <input
          value={parameters.maxLength ? parameters.maxLength : ""}
          placeholder="Maximum Length"
          key="maxLength"
          type="number"
          onChange={(ev) => {
            onChange({
              ...parameters,
              maxLength: parseInt(ev.target.value, 10),
            })
          }}
          className={`input input-primary input-bordered input-sm ${fieldControlClass}`}
        />
      </div>
      <div className={fieldClass}>
        <div className={fieldLabelClass}>
          Regular Expression Pattern{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions">
            <Tooltip
              id={`${elementId}_regex`}
              type="help"
              text="Regular expression pattern that this must satisfy"
            />
          </a>
        </div>
        <input
          value={parameters.pattern ? parameters.pattern : ""}
          placeholder="Regular Expression Pattern"
          key="pattern"
          type="text"
          onChange={(ev) => {
            onChange({
              ...parameters,
              pattern: ev.target.value,
            })
          }}
          className={`input input-primary input-bordered input-sm ${fieldControlClass}`}
        />
      </div>
      <PlaceholderInput parameters={parameters} onChange={onChange} />
      <div className={`${fieldClass} card-modal-boolean`}>
        <FBCheckbox
          onChangeValue={() => {
            onChange({
              ...parameters,
              "ui:autofocus": parameters["ui:autofocus"]
                ? parameters["ui:autofocus"] !== true
                : true,
            })
          }}
          isChecked={parameters["ui:autofocus"] ? parameters["ui:autofocus"] === true : false}
          label="Auto Focus"
        />
      </div>
    </div>
  )
}

const LongAnswer: CardComponentType = ({ parameters, onChange }) => {
  return (
    <React.Fragment>
      <h5>Default Value</h5>
      <textarea
        value={(parameters.default ?? "") as string | number | readonly string[]}
        placeholder="Default"
        onChange={(ev) => onChange({ ...parameters, default: ev.target.value })}
        className="textarea textarea-primary textarea-bordered w-full"
      />
    </React.Fragment>
  )
}

const longAnswerInput: { [key: string]: FormInput } = {
  longAnswer: {
    displayName: "Long Answer",
    matchIf: [
      {
        types: ["string"],
        widget: "textarea",
      },
    ],
    defaultDataSchema: {},
    defaultUiSchema: {
      "ui:widget": "textarea",
    },
    type: "string",
    cardBody: LongAnswer,
    modalBody: CardLongAnswerParameterInputs as CardComponentType,
  },
}

export default longAnswerInput
