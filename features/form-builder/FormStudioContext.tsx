"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface FormStudioState {
  schema: object
  uiSchema: object
  formData: object
}

interface FormStudioContextType {
  state: FormStudioState
  setSchema: (newSchema: object) => void
  setUiSchema: (newUiSchema: object) => void
  setFormData: (newFormData: object) => void
  updateState: (newState: Partial<FormStudioState>) => void
}

const FormStudioContext = createContext<FormStudioContextType | undefined>(undefined)

interface FormStudioProviderProps {
  initialSchema?: object | string
  initialUiSchema?: object | string
  initialFormData?: object
  children: ReactNode
}

export function FormStudioProvider({
  initialSchema = {},
  initialUiSchema = {},
  initialFormData = {},
  children,
}: FormStudioProviderProps) {
  const parseJSON = (data: any) => {
    if (typeof data === "string") {
      try {
        return JSON.parse(data)
      } catch (e) {
        return {}
      }
    }
    return data || {}
  }

  const [state, setState] = useState<FormStudioState>({
    schema: parseJSON(initialSchema),
    uiSchema: parseJSON(initialUiSchema),
    formData: initialFormData,
  })

  const setSchema = (newSchema: object) => {
    setState((prev) => ({ ...prev, schema: newSchema }))
  }

  const setUiSchema = (newUiSchema: object) => {
    setState((prev) => ({ ...prev, uiSchema: newUiSchema }))
  }

  const setFormData = (newFormData: object) => {
    setState((prev) => ({ ...prev, formData: newFormData }))
  }

  const updateState = (newState: Partial<FormStudioState>) => {
    setState((prev) => ({ ...prev, ...newState }))
  }

  return (
    <FormStudioContext.Provider
      value={{
        state,
        setSchema,
        setUiSchema,
        setFormData,
        updateState,
      }}
    >
      {children}
    </FormStudioContext.Provider>
  )
}

export function useFormStudio() {
  const context = useContext(FormStudioContext)
  if (!context) {
    throw new Error("useFormStudio must be used within a FormStudioProvider")
  }
  return context
}
