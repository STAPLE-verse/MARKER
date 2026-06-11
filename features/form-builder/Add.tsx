import React, { useState, useEffect, useRef, ReactElement } from "react"
import FBRadioGroup from "./radio/FBRadioGroup"
import type { ModLabels } from "./types"
import { PlusIcon } from "@heroicons/react/24/outline"

export default function Add({
  addElem,
  hidden,
  tooltipDescription,
  labels,
}: {
  addElem: (choice: string) => void
  hidden?: boolean
  tooltipDescription?: string
  labels?: ModLabels
}): ReactElement {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [createChoice, setCreateChoice] = useState("card")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [popoverOpen])

  if (hidden) return <></>

  return (
    <div ref={containerRef} className="relative flex flex-col items-center mt-4 w-full">
      <div 
        className="group w-full py-2 flex justify-center cursor-pointer border-2 border-dashed border-base-300 hover:border-primary hover:bg-primary/5 rounded-lg transition-all"
        onClick={() => setPopoverOpen(!popoverOpen)}
        title={tooltipDescription || "Add a new item or section"}
      >
        <PlusIcon className="h-6 w-6 text-base-content/50 group-hover:text-primary transition-colors" />
      </div>
      
      {popoverOpen && (
        <div className="absolute top-12 z-50 p-4 shadow-xl bg-base-100 rounded-box w-64 border border-base-300">
          <div className="font-bold text-center mb-4 border-b pb-2">Create New</div>
          <FBRadioGroup
            className="choose-create text-sm"
            defaultValue={createChoice}
            horizontal={false}
            options={[
              {
                value: "card",
                label: labels?.addElementLabel ?? "Item",
              },
              {
                value: "section",
                label: labels?.addSectionLabel ?? "Section",
              },
            ]}
            onChange={(selection) => {
              setCreateChoice(selection)
            }}
          />
          <div className="flex justify-between mt-4">
            <button onClick={() => setPopoverOpen(false)} className="btn btn-sm btn-outline btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => {
                addElem(createChoice)
                setPopoverOpen(false)
              }}
              className="btn btn-sm btn-primary"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
