import React, { useState } from "react"
import FBCheckbox from "../checkbox/FBCheckbox"
import Tooltip from "../Tooltip"
import { getRandomId } from "../utils"
import type { CardComponentType, FormInput, DataType } from "../types"
import { PlaceholderInput } from "../inputs/PlaceholderInput"
import { fieldClass, fieldControlClass, fieldLabelClass, fieldStackClass } from "../fieldLayout"

const formatDictionary = {
  "": "None",
  email: "Email",
  hostname: "Hostname",
  uri: "URI",
  regex: "Regular Expression",
}

type FormatDictionaryKey = "" | "email" | "hostname" | "uri" | "regex"

const formatTypeDictionary = {
  email: "email",
  url: "uri",
}

type FormatTypeDictionaryKey = "email" | "url"

const autoDictionary = {
  "": "None",
  email: "Email",
  username: "User Name",
  password: "Password",
  "street-address": "Street Address",
  country: "Country",
}

type AutoDictionaryKey = "" | "email" | "username" | "password" | "street-address" | "country"

// specify the inputs required for a string type object
const CardShortAnswerParameterInputs: CardComponentType = ({ parameters, onChange }) => {
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
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions"
            target="_blank"
            rel="noopener noreferrer"
          >
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
      <div className={fieldClass}>
        <div className={fieldLabelClass}>
          Format{" "}
          <Tooltip
            id={`${elementId}_format`}
            type="help"
            text="Require string input to match a certain common format"
          />
        </div>
        <select
          className={`select select-primary select-bordered select-sm ${fieldControlClass}`}
          value={parameters.format || ""}
          onChange={(e) =>
            onChange({
              ...parameters,
              format: e.target.value,
            })
          }
        >
          {Object.keys(formatDictionary).map((key) => (
            <option key={key} value={key}>
              {formatDictionary[key as FormatDictionaryKey]}
            </option>
          ))}
        </select>
      </div>
      <div className={fieldClass}>
        <div className={fieldLabelClass}>
          Auto Complete Category{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Tooltip
              id={`${elementId}_autocomplete`}
              type="help"
              text="Suggest entries based on the user's browser history"
            />
          </a>
        </div>
        <select
          className={`select select-primary select-bordered select-sm ${fieldControlClass}`}
          value={parameters["ui:autocomplete"] || ""}
          onChange={(e) =>
            onChange({
              ...parameters,
              "ui:autocomplete": e.target.value,
            })
          }
        >
          {Object.keys(autoDictionary).map((key) => (
            <option key={key} value={key}>
              {autoDictionary[key as AutoDictionaryKey]}
            </option>
          ))}
        </select>
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

const ShortAnswerField: CardComponentType = ({ parameters, onChange }) => {
  return (
    <React.Fragment>
      <h5>Default Value</h5>
      <input
        value={(parameters.default ?? "") as string | number | readonly string[]}
        placeholder="Default"
        type={
          (formatTypeDictionary[parameters.format as FormatTypeDictionaryKey] as "email" | "url") ||
          "text"
        }
        onChange={(ev) => onChange({ ...parameters, default: ev.target.value })}
        className="input input-primary input-bordered w-full"
      />
    </React.Fragment>
  )
}

const Password: CardComponentType = ({ parameters, onChange }) => {
  return (
    <React.Fragment>
      <h5>Default Password</h5>
      <input
        value={(parameters.default ?? "") as string | number | readonly string[]}
        placeholder="Default"
        type="password"
        onChange={(ev) => onChange({ ...parameters, default: ev.target.value })}
        className="input input-primary input-bordered w-full"
      />
    </React.Fragment>
  )
}

const shortAnswerInput: { [key: string]: FormInput } = {
  shortAnswer: {
    displayName: "Short Answer",
    matchIf: [
      {
        types: ["string"],
      },
      ...["email", "hostname", "uri", "regex"].map((format) => ({
        types: ["string"] as DataType[],
        format,
      })),
    ],
    defaultDataSchema: {},
    defaultUiSchema: {},
    type: "string",
    cardBody: ShortAnswerField,
    modalBody: CardShortAnswerParameterInputs,
  },
  password: {
    displayName: "Password",
    matchIf: [
      {
        types: ["string"],
        widget: "password",
      },
    ],
    defaultDataSchema: {},
    defaultUiSchema: {
      "ui:widget": "password",
    },
    type: "string",
    cardBody: Password,
    modalBody: CardShortAnswerParameterInputs,
  },
}

export default shortAnswerInput
