"use client"

import React from "react"
import { withTheme } from "@rjsf/core"
import validator from "@rjsf/validator-ajv8"
import DaisyTheme from "./DaisyTheme"
import { useFormStudio } from "./FormStudioContext"

// RJSF expects a validator to run its schemas against.
// We bundle it here with DaisyTheme for a seamless experience.
const ThemedForm = withTheme(DaisyTheme)

// Helper to remove submit button visually from the preview if needed
const hideSubmitButton = (uiSchema: any) => {
  return {
    ...uiSchema,
    "ui:submitButtonOptions": {
      norender: true,
    },
  }
}

export default function FormPreview() {
  const { state, setFormData } = useFormStudio()

  // Make sure we have a valid schema to render, otherwise it crashes
  if (!state.schema || Object.keys(state.schema).length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-base-200 rounded-box border border-base-300 p-8">
        <p className="text-base-content/60 italic">No schema defined to preview.</p>
      </div>
    )
  }

  const handleChange = ({ formData }: any) => {
    setFormData(formData)
  }

  return (
    <div className="bg-base-100 rounded-box p-6 border border-base-300 shadow-xl overflow-y-auto max-h-full">
      <h3 className="text-xl font-bold mb-4 pb-2 border-b border-base-200">Live Form Preview</h3>
      <div className="p-4 bg-base-200 rounded-xl">
        {/* We use strict true to match standard RJSF typing */}
        <ThemedForm
          schema={state.schema as any}
          uiSchema={hideSubmitButton(state.uiSchema)}
          formData={state.formData}
          onChange={handleChange}
          validator={validator}
        />
      </div>
    </div>
  )
}
