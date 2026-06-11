import React, { FC, ReactNode, MouseEvent } from "react"
import classnames from "classnames"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid"

interface CollapseProps {
  // Determines if the Collapse component is open
  isOpen: boolean
  // Toggles the isOpen boolean between true and false
  toggleCollapse: (event: MouseEvent<SVGSVGElement>) => void
  // The title to display in the collapse header
  title: ReactNode
  // Anything to be rendered within the collapse
  children: Array<ReactNode>
  // If true will gray out and disable */
  disableToggle?: boolean
  className?: string
}

const Collapse: FC<CollapseProps> = (props) => {
  const classes = classnames(`border border-base-300 rounded-xl bg-base-100 shadow-sm p-4 ${props.className || ""}`, {
    "opacity-50 pointer-events-none": props.disableToggle,
  })

  return (
    <div className={classes}>
      <div className="flex items-center gap-2">
        <span className="toggle-collapse">
          {props.isOpen ? (
            <ChevronDownIcon
              className="h-6 w-6 cursor-pointer text-primary"
              onClick={(event) => {
                if (!props.disableToggle) {
                  props.toggleCollapse(event)
                }
              }}
            />
          ) : (
            <ChevronRightIcon
              className="h-6 w-6 cursor-pointer text-primary"
              onClick={(event) => {
                if (!props.disableToggle) {
                  props.toggleCollapse(event)
                }
              }}
            />
          )}
        </span>
        <div className="w-full">{props.title}</div>
      </div>
      <div className={props.isOpen ? "block mt-4 pt-4 border-t border-base-200" : "hidden"}>
        <div>{props.children}</div>
      </div>
    </div>
  )
}

export default Collapse
