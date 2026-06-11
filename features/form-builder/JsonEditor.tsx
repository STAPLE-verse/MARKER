"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { useFormStudio } from "./FormStudioContext"

export default function JsonEditor() {
  const { state, setSchema, setUiSchema } = useFormStudio()

  // Local state to hold the raw string values
  const [localSchema, setLocalSchema] = useState(() => JSON.stringify(state.schema, null, 2))
  const [localUiSchema, setLocalUiSchema] = useState(() => JSON.stringify(state.uiSchema, null, 2))

  // Track previous master state to know when external changes occur
  const [prevSchema, setPrevSchema] = useState(state.schema)
  const [prevUiSchema, setPrevUiSchema] = useState(state.uiSchema)

  // Sync local schema if master schema changed externally (Render-phase state update)
  if (state.schema !== prevSchema) {
    setPrevSchema(state.schema)
    try {
      const parsedLocal = JSON.parse(localSchema)
      if (JSON.stringify(parsedLocal) !== JSON.stringify(state.schema)) {
        setLocalSchema(JSON.stringify(state.schema, null, 2))
      }
    } catch (e) {
      if (JSON.stringify(state.schema) !== "{}") {
        setLocalSchema(JSON.stringify(state.schema, null, 2))
      }
    }
  }

  // Sync local UI schema if master UI schema changed externally (Render-phase state update)
  if (state.uiSchema !== prevUiSchema) {
    setPrevUiSchema(state.uiSchema)
    try {
      const parsedLocal = JSON.parse(localUiSchema)
      if (JSON.stringify(parsedLocal) !== JSON.stringify(state.uiSchema)) {
        setLocalUiSchema(JSON.stringify(state.uiSchema, null, 2))
      }
    } catch (e) {
      if (JSON.stringify(state.uiSchema) !== "{}") {
        setLocalUiSchema(JSON.stringify(state.uiSchema, null, 2))
      }
    }
  }

  const handleSchemaChange = (value: string | undefined) => {
    const val = value || ""
    setLocalSchema(val)
    try {
      // Must try/catch because JSON.parse throws fatal exceptions on invalid strings
      const parsed = JSON.parse(val)
      setSchema(parsed)
    } catch {
      // Silently swallow the exception. Monaco shows the red squiggles to the user,
      // so we just wait until they fix it before updating the master context.
    }
  }

  const handleUiSchemaChange = (value: string | undefined) => {
    const val = value || ""
    setLocalUiSchema(val)
    try {
      const parsed = JSON.parse(val)
      setUiSchema(parsed)
    } catch {
      // Silently swallow
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row gap-6 w-full h-full overflow-y-auto pb-8 pt-4">
        <div className="flex-1 min-w-0 flex flex-col h-[500px] lg:h-full">
          <h4 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-2">Data Schema</h4>
          <div className="bg-base-200 rounded-lg border border-base-300 flex-1 overflow-hidden py-2 relative">
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={localSchema}
              onChange={handleSchemaChange}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                formatOnPaste: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col h-[500px] lg:h-full">
          <h4 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-2">UI Schema</h4>
          <div className="bg-base-200 rounded-lg border border-base-300 flex-1 overflow-hidden py-2 relative">
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={localUiSchema}
              onChange={handleUiSchemaChange}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                formatOnPaste: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
