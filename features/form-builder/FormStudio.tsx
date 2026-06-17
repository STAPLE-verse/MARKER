"use client"

import { useState, useEffect, useRef } from "react"
import { FormStudioProvider, useFormStudio } from "./FormStudioContext"
import dynamic from "next/dynamic"
import FormBuilder from "./FormBuilder"
import FormPreview from "./FormPreview"

import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid"

// Lazy-load the JSON editor to prevent loading Monaco until the user actually clicks the tab
const JsonEditor = dynamic(() => import("./JsonEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-base-200 rounded-lg border border-base-300">
      <span className="loading loading-spinner text-primary loading-lg"></span>
    </div>
  ),
})
import type { Mods } from "./types"

interface FormStudioProps {
  initialSchema?: string | object
  initialUiSchema?: string | object
  onAutoSave?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void> | void
  onSave?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>
  onSaveNewVersion?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>
  onCancel?: () => void
  mods?: Mods
}

export function FormStudioUI({ onAutoSave, onSave, onSaveNewVersion, onCancel, mods }: { onAutoSave?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void> | void; onSave?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>; onSaveNewVersion?: (state: { schema: object; uiSchema: object; formData: object }) => Promise<void>; onCancel?: () => void; mods?: Mods }) {
  const { state, setSchema, setUiSchema } = useFormStudio()
  const [activeTab, setActiveTab] = useState<"builder" | "json" | "preview">("builder")
  
  // Track if the JSON tab has ever been visited so we only load the heavy editor once,
  // but keep it mounted in the background to preserve undo history and unsaved text.
  const [hasVisitedJson, setHasVisitedJson] = useState(false)
  if (activeTab === "json" && !hasVisitedJson) {
    setHasVisitedJson(true)
  }

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const isInitialMount = useRef(true)
  const lastSavedStateRef = useRef<string>("")

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastSavedStateRef.current = JSON.stringify({ schema: state.schema, uiSchema: state.uiSchema })
      return
    }
    if (!onAutoSave) return

    const currentStateStr = JSON.stringify({ schema: state.schema, uiSchema: state.uiSchema })
    
    // If the JSON hasn't actually changed, ignore the aggressive React render and return early
    if (currentStateStr === lastSavedStateRef.current) {
      return
    }

    setSaveStatus("unsaved")
    const handler = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        await onAutoSave(state)
        lastSavedStateRef.current = currentStateStr // Cache the successfully saved state
        setSaveStatus("saved")
      } catch (e) {
        console.error("Auto-save failed", e)
        setSaveStatus("unsaved")
      }
    }, 1500)

    return () => clearTimeout(handler)
  }, [state.schema, state.uiSchema, onAutoSave])

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-300 bg-base-100 border border-base-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-base-200 px-4 pt-4 bg-base-200 gap-4">
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

        <div className="flex items-center gap-3 pb-3">
          {onAutoSave && (
            <div className="flex items-center mr-1 bg-base-100 px-3 py-1.5 rounded-full border border-base-300 shadow-sm min-w-[130px] justify-center transition-all">
              {saveStatus === "saved" && (
                <span className="text-xs font-medium text-base-content/60 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-success/80" />
                  Saved locally
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="text-xs font-medium text-base-content/70 flex items-center gap-1.5">
                  <span className="loading loading-spinner loading-xs text-primary"></span>
                  Saving...
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="text-xs font-medium text-warning flex items-center gap-1.5">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  Unsaved changes
                </span>
              )}
            </div>
          )}
          {onCancel && (
            <button className="btn btn-secondary btn-outline transition-all ml-2" onClick={onCancel}>
              Cancel
            </button>
          )}
          {onSave && (
            <div className="tooltip tooltip-bottom" data-tip="Overwrites the current version of this schema.">
              <button className="btn btn-ghost border border-base-300 hover:border-base-content/30 shadow-sm transition-all" onClick={() => onSave(state)}>
                Save Changes
              </button>
            </div>
          )}
          {onSaveNewVersion && (
            <div className="tooltip tooltip-bottom tooltip-primary" data-tip="Preserves current history and saves edits as a brand new version.">
              <button className="btn btn-primary shadow-sm hover:shadow-md transition-all" onClick={() => onSaveNewVersion(state)}>
                Save as New Version
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden p-6">
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
          {hasVisitedJson && <JsonEditor />}
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
      <FormStudioUI onAutoSave={props.onAutoSave} onSave={props.onSave} onSaveNewVersion={props.onSaveNewVersion} onCancel={props.onCancel} mods={props.mods} />
    </FormStudioProvider>
  )
}
