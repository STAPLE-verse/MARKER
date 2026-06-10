"use client"

import React, { useState } from "react"
import { JsonEditor as ReactJsonEditor } from "json-edit-react"
import { useFormStudio } from "./FormStudioContext"

export default function JsonEditor() {
  const { state, setSchema, setUiSchema } = useFormStudio()
  const [restrictEdit, setRestrictEdit] = useState(true)

  const handleSchemaChange = (data: any) => {
    setSchema(data.newData)
  }

  const handleUiSchemaChange = (data: any) => {
    setUiSchema(data.newData)
  }

  const toggleEditable = () => {
    setRestrictEdit(!restrictEdit)
  }

  return (
    <div className="flex flex-col h-full bg-base-100 rounded-box p-4 border border-base-300 shadow-xl">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-base-200">
        <h3 className="text-xl font-bold">JSON Data & UI Schemas</h3>
        <button onClick={toggleEditable} className={`btn btn-sm ${restrictEdit ? "btn-outline btn-secondary" : "btn-warning"}`}>
          {restrictEdit ? "Enable Editing" : "Disable Editing"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full h-full overflow-y-auto">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-2">Data Schema</h4>
          <div className="bg-base-200 p-2 rounded-lg border border-base-300">
            <ReactJsonEditor
              data={state.schema}
              onUpdate={handleSchemaChange}
              restrictEdit={!restrictEdit}
              restrictDelete={!restrictEdit}
              restrictAdd={!restrictEdit}
              restrictTypeSelection={!restrictEdit}
              restrictDrag={!restrictEdit}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-2">UI Schema</h4>
          <div className="bg-base-200 p-2 rounded-lg border border-base-300">
            <ReactJsonEditor
              data={state.uiSchema}
              onUpdate={handleUiSchemaChange}
              restrictEdit={!restrictEdit}
              restrictDelete={!restrictEdit}
              restrictAdd={!restrictEdit}
              restrictTypeSelection={!restrictEdit}
              restrictDrag={!restrictEdit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
