"use client"

import React, { ReactElement, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import Card from "./Card"
import Section from "./Section"
import Add from "./Add"
import MarkdownDescriptionInput from "./MarkdownDescriptionInput"
import {
  parse,
  stringify,
  checkForUnsupportedFeatures,
  generateElementComponentsFromSchemas,
  addCardObj,
  addSectionObj,
  onDragEnd,
  generateCategoryHash,
  excludeKeys,
  DROPPABLE_TYPE,
} from "./utils"
import DEFAULT_FORM_INPUTS from "./defaults/defaultFormInputs"
import type { Mods, InitParameters, AddFormObjectParametersType } from "./types"


export default function FormBuilder({
  schema,
  uischema,
  onMount,
  onChange,
  mods,
  className,
}: {
  schema: string
  uischema: string
  onMount?: (parameters: InitParameters) => any
  onChange: (schema: string, uischema: string) => any
  mods?: Mods
  className?: string
}): ReactElement {
  const schemaData = parse(schema)
  schemaData.type = "object"
  const uiSchemaData = parse(uischema)
  const allFormInputs = excludeKeys(
    Object.assign({}, DEFAULT_FORM_INPUTS, (mods && mods.customFormInputs) || {}),
    mods && mods.deactivatedFormInputs
  )

  const unsupportedFeatures = checkForUnsupportedFeatures(
    schemaData,
    uiSchemaData,
    allFormInputs
  ).filter(
    (msg) =>
      !msg.includes("Object Property: _stapleSchema") &&
      !msg.includes("Property Parameter: readOnly in _stapleSchema") &&
      !msg.includes("UI Widget: hidden for _stapleSchema") &&
      !msg.includes("UI schema property: _stapleSchema") &&
      !msg.includes("allOf")
  )

  const [cardOpenState, setCardOpenState] = React.useState<Record<string, boolean>>({})
  const categoryHash = generateCategoryHash(allFormInputs)

  const isFirstRender = React.useRef(true)

  const addProperties: AddFormObjectParametersType = {
    schema: schemaData,
    uischema: uiSchemaData,
    mods: mods,
    onChange: (newSchema: { [key: string]: any }, newUiSchema: { [key: string]: any }) =>
      onChange(stringify(newSchema), stringify(newUiSchema)),
    definitionData: schemaData.definitions,
    definitionUi: uiSchemaData.definitions,
    categoryHash,
  }

  const hideAddButton = schemaData.properties && Object.keys(schemaData.properties).length !== 0

  useEffect(() => {
    if (isFirstRender.current) {
      if (onMount)
        onMount({
          categoryHash,
        })
      isFirstRender.current = false
    }
  }, [onMount, categoryHash])

  return (
    <div className={`formBuilder ${className || ""}`}>
      <div
        className="alert alert-warning mb-4 flex-col items-start"
        style={{
          display: unsupportedFeatures.length === 0 ? "none" : "flex",
        }}
      >
        <h5 className="font-bold">Unsupported Features:</h5>
        <ul className="list-disc pl-5">
          {unsupportedFeatures.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
      {(!mods || mods.showFormHead !== false) && (
        <div className="formHead" data-test="form-head">
          <div>
            <h5 data-test="form-name-label" className="font-semibold mb-2">
              {mods && mods.labels && typeof mods.labels.formNameLabel === "string"
                ? mods.labels.formNameLabel
                : "Form Name"}
            </h5>
            <input
              value={schemaData.title || ""}
              placeholder="Title"
              type="text"
              onChange={(ev) => {
                onChange(
                  stringify({
                    ...schemaData,
                    title: ev.target.value,
                  }),
                  uischema
                )
              }}
              className="input input-primary input-bordered w-full form-title mb-4"
            />
          </div>
          <div>
            <h5 data-test="form-description-label" className="font-semibold mb-2">
              {mods && mods.labels && typeof mods.labels.formDescriptionLabel === "string"
                ? mods.labels.formDescriptionLabel
                : "Form Description"}
            </h5>
            <MarkdownDescriptionInput
              value={schemaData.description || ""}
              onChange={(val) =>
                onChange(
                  stringify({
                    ...schemaData,
                    description: val,
                  }),
                  uischema
                )
              }
            />
          </div>
        </div>
      )}
      <div className="form-body formBody mt-6">
        <DragDropContext
          onDragEnd={(result) =>
            onDragEnd(result, {
              schema: schemaData,
              uischema: uiSchemaData,
              onChange: (newSchema, newUiSchema) =>
                onChange(stringify(newSchema), stringify(newUiSchema)),
              definitionData: schemaData.definitions,
              definitionUi: uiSchemaData.definitions,
              categoryHash,
            })
          }
        >
          <Droppable droppableId="droppable" type={DROPPABLE_TYPE}>
            {(providedDroppable) => (
              <div 
                ref={providedDroppable.innerRef} 
                {...providedDroppable.droppableProps}
                className="mb-4"
              >
                {generateElementComponentsFromSchemas({
                  schemaData,
                  uiSchemaData,
                  onChange: (newSchema, newUiSchema) =>
                    onChange(stringify(newSchema), stringify(newUiSchema)),
                  definitionData: schemaData.definitions,
                  definitionUi: uiSchemaData.definitions,
                  path: "root",
                  cardOpenState,
                  setCardOpenState,
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
                        style={providedDraggable.draggableProps.style}
                        className={`pb-4 ${snapshot.isDragging && !snapshot.isDropAnimating ? "opacity-60" : ""}`}
                      >
                        {React.cloneElement(element, {
                          dragHandleProps: providedDraggable.dragHandleProps,
                        })}
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
      <div className="form-footer formFooter">
        {!hideAddButton && mods?.components?.add && mods.components.add(addProperties)}
        {!mods?.components?.add && (
          <Add
            tooltipDescription={((mods || {}).tooltipDescriptions || {}).add}
            labels={mods?.labels ?? {}}
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
    </div>
  )
}
