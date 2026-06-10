"use client"

import React, { useState } from "react"
import { FormStudioProvider, useFormStudio } from "./FormStudioContext"
import FormBuilder from "./FormBuilder"
import JsonEditor from "./JsonEditor"
import FormPreview from "./FormPreview"
import type { Mods } from "./types"

interface FormStudioProps {
  initialSchema?: string | object
  initialUiSchema?: string | object
  onSave?: (state: { schema: object; uiSchema: object; formData: object }) => void
  mods?: Mods
}

function FormStudioInner({ onSave, mods }: { onSave?: (state: any) => void; mods?: Mods }) {
  const { state, setSchema, setUiSchema } = useFormStudio()
  const [activeTab, setActiveTab] = useState<"builder" | "json" | "preview">("builder")

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="tabs tabs-bordered w-full md:w-auto">
          <button
            className={`tab tab-lg transition-all font-semibold ${activeTab === "builder" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
            onClick={() => setActiveTab("builder")}
          >
            Visual Builder
          </button>
          <button
            className={`tab tab-lg transition-all font-semibold ${activeTab === "json" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
            onClick={() => setActiveTab("json")}
          >
            JSON Editor
          </button>
          <button
            className={`tab tab-lg transition-all font-semibold ${activeTab === "preview" ? "tab-active text-primary" : "text-base-content/60 hover:text-base-content/80"}`}
            onClick={() => setActiveTab("preview")}
          >
            Live Preview
          </button>
        </div>

        {onSave && (
          <button className="btn btn-primary shadow-md hover:shadow-lg transition-all" onClick={() => onSave(state)}>
            Save Form
          </button>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 rounded-xl overflow-y-auto overflow-x-hidden px-1 pr-2">
        <div className={activeTab === "builder" ? "block" : "hidden"}>
          <FormBuilder
            schema={typeof state.schema === "string" ? state.schema : JSON.stringify(state.schema)}
            uischema={typeof state.uiSchema === "string" ? state.uiSchema : JSON.stringify(state.uiSchema)}
            onChange={(newSchemaStr: string, newUiSchemaStr: string) => {
              try {
                setSchema(JSON.parse(newSchemaStr))
                setUiSchema(JSON.parse(newUiSchemaStr))
              } catch (e) {
                console.error("Failed to parse schema from FormBuilder", e)
              }
            }}
            mods={mods}
          />
        </div>
        <div className={activeTab === "json" ? "block h-full" : "hidden"}>
          <JsonEditor />
        </div>
        <div className={activeTab === "preview" ? "block" : "hidden"}>
          <FormPreview />
        </div>
      </div>
    </div>
  )
}

export default function FormStudio(props: FormStudioProps) {
  return (
    <FormStudioProvider initialSchema={props.initialSchema} initialUiSchema={props.initialUiSchema}>
      <FormStudioInner onSave={props.onSave} mods={props.mods} />
    </FormStudioProvider>
  )
}
