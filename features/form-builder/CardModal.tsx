import React, { useState, useEffect } from "react"
import DependencyField from "./dependencies/DependencyField"
import type { CardModalType, CardComponentPropsType } from "./types"
import Tooltip from "./Tooltip"

const CardModal: CardModalType = ({
  componentProps,
  onChange,
  isOpen,
  onClose,
  TypeSpecificParameters,
}) => {
  // assign state values for parameters that should only change on hitting "Save"
  const [componentPropsState, setComponentProps] = useState(componentProps)

  useEffect(() => {
    setComponentProps(componentProps)
  }, [componentProps])

  if (!isOpen) return null

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`} data-test="card-modal">
      <div className="modal-box w-11/12 max-w-3xl overflow-visible">
        <div style={{ display: componentProps.hideKey ? "none" : "initial" }} className="mb-4 border-b pb-2">
          <h3 className="text-xl font-bold">Additional Settings</h3>
        </div>
        <div className="py-4 space-y-6">
          <TypeSpecificParameters
            parameters={componentPropsState}
            onChange={(newState: CardComponentPropsType) => {
              setComponentProps({
                ...componentPropsState,
                ...newState,
              })
            }}
          />
          <div>
            <div className="text-[18px] font-bold mb-2 flex items-center gap-2">
              Column Size
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Basic_Concepts_of_Grid_Layout"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Tooltip
                  id="column_size_tooltip"
                  type="help"
                  text="Set the column size of the item"
                />
              </a>
            </div>
            <input
              value={componentPropsState["ui:column"] ? componentPropsState["ui:column"] : ""}
              placeholder="Column Size"
              key="ui:column"
              type="number"
              min={0}
              onChange={(ev) => {
                setComponentProps({
                  ...componentPropsState,
                  "ui:column": ev.target.value,
                })
              }}
              className="input input-bordered w-full max-w-xs"
            />
          </div>
          <DependencyField
            parameters={componentPropsState}
            onChange={(newState) => {
              setComponentProps({
                ...componentPropsState,
                ...newState,
              })
            }}
          />
        </div>
        <div className="modal-action">
          <button
            onClick={() => {
              onClose()
              setComponentProps(componentProps)
            }}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose()
              onChange(componentPropsState)
            }}
            className="btn btn-primary"
          >
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => onClose()}>close</button>
      </form>
    </dialog>
  )
}

export default CardModal
