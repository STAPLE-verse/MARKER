import React, { FC } from "react"
import { getCardBody } from "./utils"
import type { Mods, FormInput, CardComponentPropsType } from "./types"

interface GeneralParameterInputsProps {
  category: string
  parameters: CardComponentPropsType
  onChange: (newParams: CardComponentPropsType) => void
  mods?: Mods
  allFormInputs: { [key: string]: FormInput }
}

// specify the inputs required for any type of object
const GeneralParameterInputs: FC<GeneralParameterInputsProps> = ({
  category,
  parameters,
  onChange,
  mods,
  allFormInputs,
}) => {
  const CardBody = getCardBody(category, allFormInputs)
  return (
    <div className="flex flex-col gap-2 pb-2 [&>h5]:text-[18px] [&>h5]:font-bold [&>h5]:leading-6 [&>input]:mt-0 [&>select]:mt-0 [&>textarea]:mt-0">
      <CardBody parameters={parameters} onChange={onChange} mods={mods || {}} />
    </div>
  )
}

export default GeneralParameterInputs
