import React, { ReactElement } from "react"
import FBCheckbox from "./checkbox/FBCheckbox"
import Collapse from "./Collapse/Collapse"
import CardModal from "./CardModal"
import CardGeneralParameterInputs from "./CardGeneralParameterInputs"
import Add from "./Add"
import Tooltip from "./Tooltip"
import { getRandomId } from "./utils"
import type { CardPropsType, CardComponentPropsType } from "./types"
import { ArrowsPointingOutIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function Card({
  componentProps,
  onChange,
  onDelete,
  TypeSpecificParameters,
  addElem,
  cardOpen,
  setCardOpen,
  allFormInputs,
  mods,
  showObjectNameInput = true,
  addProperties,
  dragHandleProps,
}: CardPropsType): ReactElement {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [elementId] = React.useState(getRandomId())

  return (
    <React.Fragment>
      <Collapse
        isOpen={cardOpen}
        toggleCollapse={() => setCardOpen(!cardOpen)}
        title={
          <div className="flex justify-between items-center w-full">
            <span onClick={() => setCardOpen(!cardOpen)} className="text-lg font-bold cursor-pointer select-none">
              {componentProps.title || componentProps.name}{" "}
              {componentProps.parent ? (
                <Tooltip
                  text={`Depends on ${componentProps.parent}`}
                  id={`${elementId}_parentinfo`}
                  type="alert"
                />
              ) : (
                ""
              )}
              {componentProps.$ref !== undefined ? (
                <Tooltip
                  text={`Is an instance of pre-configured component ${componentProps.$ref}`}
                  id={`${elementId}_refinfo`}
                  type="alert"
                />
              ) : (
                ""
              )}
            </span>
            <span
              {...(dragHandleProps ?? {})}
              className="tooltip tooltip-left tooltip-info z-50 before:max-w-xs cursor-grab active:cursor-grabbing p-1"
              data-tip="Drag to move form item"
              id={`${elementId}_moveformcard`}
            >
              <ArrowsPointingOutIcon
                className="w-6 h-6 stroke-2 text-base-content/50 hover:text-base-content transition-colors"
                onClick={() => {}}
              />
            </span>
          </div>
        }
        className={`card-container ${componentProps.dependent ? "card-dependent" : ""} ${
          componentProps.$ref === undefined ? "" : "card-reference"
        }`}
      >
        <div className="cardEntries">
          <CardGeneralParameterInputs
            parameters={componentProps}
            onChange={onChange}
            allFormInputs={allFormInputs}
            mods={mods}
            showObjectNameInput={showObjectNameInput}
          />
        </div>
        <div className="flex items-center justify-end gap-4 w-full mt-6 pt-4 border-t border-base-200">
          <FBCheckbox
            onChangeValue={() =>
              onChange({
                ...componentProps,
                required: !componentProps.required,
              })
            }
            isChecked={!!componentProps.required}
            label="Required"
            id={`${elementId}_required`}
          />
          <span className="tooltip tooltip-left tooltip-info z-50 before:max-w-xs cursor-pointer p-1" data-tip="Additional configurations for this item" id={`${elementId}_editinfo`}>
            <PencilIcon className="w-5 h-5 text-secondary hover:text-primary transition-colors" onClick={() => setModalOpen(true)} />
          </span>
          <span className="tooltip tooltip-left tooltip-info z-50 before:max-w-xs cursor-pointer p-1" data-tip="Delete item" id={`${elementId}_trashinfo`}>
            <TrashIcon className="w-5 h-5 text-warning hover:text-error transition-colors" onClick={() => onDelete && onDelete()} />
          </span>
        </div>
        <CardModal
          componentProps={componentProps as CardComponentPropsType}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onChange={(newComponentProps: CardComponentPropsType) => {
            onChange(newComponentProps)
          }}
          TypeSpecificParameters={TypeSpecificParameters}
        />
      </Collapse>
      {mods?.components?.add && mods?.components?.add(addProperties)}
      {!mods?.components?.add && addElem && (
        <Add
          tooltipDescription={((mods || {}).tooltipDescriptions || {}).add}
          addElem={(choice: string) => addElem(choice)}
        />
      )}
    </React.Fragment>
  )
}
