import React, { ReactElement } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import MarkdownDescriptionInput from "./MarkdownDescriptionInput"
import FBCheckbox from "./checkbox/FBCheckbox"
import Collapse from "./Collapse/Collapse"
import CardModal from "./CardModal"
import { CardDefaultParameterInputs } from "./defaults/defaultInputs"
import Tooltip from "./Tooltip"
import Add from "./Add"
import Card from "./Card"
import {
  checkForUnsupportedFeatures,
  generateElementComponentsFromSchemas,
  countElementsFromSchema,
  addCardObj,
  addSectionObj,
  onDragEnd,
  DROPPABLE_TYPE,
} from "./utils"
import { getRandomId } from "./utils"
import type { SectionPropsType } from "./types"
import { ArrowsPointingOutIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function Section({
  name,
  required,
  schema,
  uischema,
  onChange,
  onNameChange,
  onRequireToggle,
  onDependentsChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  path,
  definitionData,
  definitionUi,
  hideKey,
  reference,
  dependents,
  dependent,
  parent,
  parentProperties,
  neighborNames,
  cardOpen,
  setCardOpen,
  allFormInputs,
  mods,
  categoryHash,
}: SectionPropsType): ReactElement {
  const unsupportedFeatures = checkForUnsupportedFeatures(
    schema || {},
    uischema || {},
    allFormInputs
  )
  const schemaData = schema || {}
  const elementNum = countElementsFromSchema(schemaData)
  const defaultCollapseStates = [...Array(elementNum)].map(() => false)
  const [cardOpenArray, setCardOpenArray] = React.useState(defaultCollapseStates)
  // keep name in state to avoid losing focus
  const [keyName, setKeyName] = React.useState(name)
  const [keyError, setKeyError] = React.useState<null | string>(null)
  // keep requirements in state to avoid rapid updates
  const [modalOpen, setModalOpen] = React.useState(false)
  const [elementId] = React.useState(getRandomId())
  const addProperties = {
    schema,
    uischema,
    mods,
    onChange,
    definitionData,
    definitionUi,
    categoryHash,
  }
  const hideAddButton = schemaData.properties && Object.keys(schemaData.properties).length !== 0

  return (
    <React.Fragment>
      {/* @ts-expect-error children error */}
      <Collapse
        isOpen={cardOpen}
        toggleCollapse={() => setCardOpen(!cardOpen)}
        title={
          <div className="flex justify-between items-center w-full">
            <span onClick={() => setCardOpen(!cardOpen)} className="text-xl font-bold cursor-pointer select-none">
              {schemaData.title || keyName}{" "}
              {parent ? (
                <Tooltip
                  text={`Depends on ${parent}`}
                  id={`${elementId}_parentinfo`}
                  type="alert"
                />
              ) : (
                ""
              )}
            </span>
            <span className="tooltip tooltip-top cursor-grab active:cursor-grabbing p-1" data-tip="Drag to move section" id={`${elementId}_moveinfosection`}>
              <ArrowsPointingOutIcon
                className="w-6 h-6 stroke-2 text-base-content/50 hover:text-base-content transition-colors"
                onClick={() => {}}
              />
            </span>
          </div>
        }
        className={`section-container sectionContainer ${dependent ? "section-dependent" : ""} ${
          reference ? "section-reference" : ""
        }`}
      >
        <div className={`section-entries ${reference ? "section-reference" : ""}`}>
          <div className="section-head">
            {reference ? (
              <div className="section-entry section-reference">
                <h5>Reference Section</h5>
                <select
                  className="select select-bordered w-full mt-2 mb-2 text-primary border-primary border-2 bg-primary-content"
                  value={reference}
                  onChange={(e) => {
                    onChange(schema, uischema, e.target.value)
                  }}
                >
                  {Object.keys(definitionData).map((key) => (
                    <option key={`#/definitions/${key}`} value={`#/definitions/${key}`}>
                      {`#/definitions/${key}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              ""
            )}
            <div className="section-entry" data-test="section-object-name">
              <h5>
                Section Variable Name{" "}
                <Tooltip
                  text={
                    mods &&
                    mods.tooltipDescriptions &&
                    mods.tooltipDescriptions &&
                    typeof mods.tooltipDescriptions.cardSectionObjectName === "string"
                      ? mods.tooltipDescriptions.cardSectionObjectName
                      : "The name in the downloaded data for this section."
                  }
                  id={`${elementId}_nameinfo`}
                  type="help"
                />
              </h5>
              <div className="form-control w-full mt-2">
                <input
                  value={keyName || ""}
                  placeholder="Key"
                  type="text"
                  onChange={(ev) => setKeyName(ev.target.value)}
                  onBlur={(ev) => {
                    const { value } = ev.target
                    if (value === name || !(neighborNames && neighborNames.includes(value))) {
                      setKeyError(null)
                      onNameChange(value)
                    } else {
                      setKeyName(name)
                      setKeyError(`"${value}" is already in use.`)
                      onNameChange(name)
                    }
                  }}
                  className={`input input-primary input-bordered w-full card-text ${keyError !== null ? 'input-error' : ''}`}
                  readOnly={hideKey}
                />
                {keyError && (
                  <div className="label">
                    <span className="label-text-alt text-error">{keyError}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="section-entry" data-test="section-display-name">
              <h5>
                Section Display Name{" "}
                <Tooltip
                  text={
                    mods &&
                    mods.tooltipDescriptions &&
                    mods.tooltipDescriptions &&
                    typeof mods.tooltipDescriptions.cardSectionDisplayName === "string"
                      ? mods.tooltipDescriptions.cardSectionDisplayName
                      : "The name of the section that will be shown to contributors completing the form."
                  }
                  id={`${elementId}_titleinfo`}
                  type="help"
                />
              </h5>
              <input
                value={schemaData.title || ""}
                placeholder="Title"
                type="text"
                onChange={(ev) =>
                  onChange(
                    {
                      ...schema,
                      title: ev.target.value,
                    },
                    uischema
                  )
                }
                className="input input-primary input-bordered w-full card-text mt-2"
              />
            </div>
            <div className="section-entry" data-test="section-description">
              <h5>
                Section Description{" "}
                <Tooltip
                  text={
                    mods &&
                    mods.tooltipDescriptions &&
                    mods.tooltipDescriptions &&
                    typeof mods.tooltipDescriptions.cardSectionDescription === "string"
                      ? mods.tooltipDescriptions.cardSectionDescription
                      : "A description of the section which will be visible on the form."
                  }
                  id={`${elementId}_descriptioninfo`}
                  type="help"
                />
              </h5>
              <MarkdownDescriptionInput
                value={schemaData.description || ""}
                onChange={(val) => onChange({ ...schema, description: val }, uischema)}
              />
            </div>
            <div
              className="alert alert-warning mb-4 mt-4 flex-col items-start"
              style={{
                display: unsupportedFeatures.length === 0 ? "none" : "flex",
              }}
            >
              <h5 className="font-bold">Unsupported Features:</h5>
              <ul className="list-disc pl-5">
                {unsupportedFeatures.map((message) => (
                  <li key={`${elementId}_${message}`}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="section-body">
            {/* @ts-expect-error children error */}
            <DragDropContext
              onDragEnd={(result) =>
                onDragEnd(result, {
                  schema,
                  uischema,
                  onChange,
                  definitionData,
                  definitionUi,
                  categoryHash,
                })
              }
            >
              {/* @ts-expect-error children error */}
              <Droppable droppableId="droppable" type={DROPPABLE_TYPE}>
                {(providedDroppable) => (
                  <div 
                    ref={providedDroppable.innerRef} 
                    {...providedDroppable.droppableProps}
                    className="mt-4"
                  >
                    {generateElementComponentsFromSchemas({
                      schemaData: schema,
                      uiSchemaData: uischema,
                      onChange,
                      path,
                      definitionData,
                      definitionUi,
                      cardOpenArray,
                      setCardOpenArray,
                      allFormInputs,
                      mods,
                      categoryHash,
                      Card,
                      Section,
                    }).map((element: any, index) => (
                      // @ts-ignore: suppress key error, can't change key assignment
                      <Draggable key={element.key} draggableId={element.key} index={index}>
                        {(providedDraggable, snapshot) => (
                          <div
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            {...providedDraggable.dragHandleProps}
                            style={providedDraggable.draggableProps.style}
                            className={`pb-4 ${snapshot.isDragging && !snapshot.isDropAnimating ? "opacity-60" : ""}`}
                          >
                            {element}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {providedDroppable.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="section-footer">
            {!hideAddButton && mods?.components?.add && mods.components.add(addProperties)}
            {!mods?.components?.add && (
              <Add
                tooltipDescription={((mods || {}).tooltipDescriptions || {}).add}
                addElem={(choice: string) => {
                  if (choice === "card") {
                    addCardObj(addProperties)
                  } else if (choice === "section") {
                    addSectionObj(addProperties)
                  }
                }}
                hidden={hideAddButton}
              />
            )}
          </div>
          <div className="section-interactions">
            <div className="flex items-center justify-end gap-4 w-full mt-6 pt-4 border-t border-base-200">
              <FBCheckbox
                onChangeValue={() => onRequireToggle()}
                isChecked={required}
                label="Required"
                id={`${elementId}_required`}
              />
              <span className="tooltip tooltip-top cursor-pointer p-1" data-tip="Additional configurations for this item" id={`${elementId}_editinfo`}>
                <PencilIcon
                  className="w-5 h-5 text-secondary hover:text-primary transition-colors"
                  onClick={() => setModalOpen(true)}
                />
              </span>
              <span className="tooltip tooltip-top cursor-pointer p-1" data-tip="Delete item" id={`${elementId}_trashinfo`}>
                <TrashIcon
                  className="w-5 h-5 text-warning hover:text-error transition-colors"
                  onClick={() => (onDelete ? onDelete() : {})}
                />
              </span>
            </div>
          </div>
        </div>
        <CardModal
          componentProps={{
            dependents,
            neighborNames,
            name: keyName,
            schema,
            type: "object",
            "ui:column": uischema["ui:column"] ?? "",
            "ui:options": uischema["ui:options"] ?? "",
          }}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onChange={(newComponentProps: { [key: string]: any }) => {
            onDependentsChange(newComponentProps.dependents)
            onChange(schema, {
              ...uischema,
              "ui:column": newComponentProps["ui:column"],
            })
          }}
          TypeSpecificParameters={CardDefaultParameterInputs}
        />
      </Collapse>
      {mods?.components?.add && mods.components.add(parentProperties)}
      {!mods?.components?.add && (
        <Add
          tooltipDescription={((mods || {}).tooltipDescriptions || {}).add}
          addElem={(choice: string) => {
            if (choice === "card") {
              addCardObj(parentProperties)
            } else if (choice === "section") {
              addSectionObj(parentProperties)
            }
            setCardOpen(false)
          }}
        />
      )}
    </React.Fragment>
  )
}
