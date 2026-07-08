import { useState } from "react"
import DependencyField from "./dependencies/DependencyField"
import type { CardModalType, CardComponentPropsType } from "./types"
import Tooltip from "./Tooltip"
import { fieldClass, fieldControlClass, fieldLabelClass, fieldStackClass } from "./fieldLayout"

const CardModal: CardModalType = ({
  componentProps,
  onChange,
  isOpen,
  onClose,
  TypeSpecificParameters,
}) => {
  // assign state values for parameters that should only change on hitting "Save"
  const [componentPropsState, setComponentProps] = useState(componentProps)

  const [prevComponentProps, setPrevComponentProps] = useState(componentProps)
  if (componentProps !== prevComponentProps) {
    setPrevComponentProps(componentProps)
    setComponentProps(componentProps)
  }

  if (!isOpen) return null

  return (
    <dialog
      className={`modal ${isOpen ? "modal-open" : ""}`}
      data-test="card-modal"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div className="modal-box flex max-h-[calc(100vh-4rem)] w-11/12 max-w-3xl flex-col overflow-hidden">
        <div style={{ display: componentProps.hideKey ? "none" : "initial" }} className="mb-4 shrink-0 border-b border-base-200 pb-2">
          <h3 className="text-xl font-bold">Additional Settings</h3>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-1.5 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${fieldStackClass}`}
        >
          <TypeSpecificParameters
            parameters={componentPropsState}
            onChange={(newState: CardComponentPropsType) => {
              setComponentProps({
                ...componentPropsState,
                ...newState,
              })
            }}
          />
          <div className={fieldClass}>
            <div className={`${fieldLabelClass} flex items-center gap-2`}>
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
              className={`input input-primary input-bordered input-sm ${fieldControlClass}`}
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
        <div className="modal-action shrink-0">
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
