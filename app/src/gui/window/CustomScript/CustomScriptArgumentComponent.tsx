import { Dispatch, Fragment, SetStateAction, useState } from "react"
import {
  ARGUMENT_FIELDS,
  CustomScriptArgumentField,
  DEFAULT_ARGUMENTS,
} from "../../../data/CustomScriptWindowData"
import { CustomScriptArgument } from "../../../util/custom-script/CustomScriptTypes"
import { ReactIcon } from "../../Icons"
import { DropdownInput } from "../../inputs/DropdownInput"
import { MultilineTextInput } from "../../inputs/MultilineTextInput"
import { TextInput } from "../../inputs/TextInput"
import { ValueInput } from "../../inputs/ValueInput"

export function CustomScriptArgumentComponent(props: {
  argument: CustomScriptArgument
  setArgument: Dispatch<SetStateAction<CustomScriptArgument>>
}) {
  const [expanded, setExpanded] = useState(false)

  function resolveInput<T extends CustomScriptArgument>(
    field: CustomScriptArgumentField<T>,
    argument: T
  ) {
    return typeof field.input == "function"
      ? field.input(argument)
      : field.input
  }

  console.log(props.argument)

  return (
    <div>
      <div
        className="pref-item"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          style={{
            width: "10rem",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {props.argument.name}
        </span>
        <span
          style={{
            marginLeft: "0.5rem",
            marginRight: "auto",
            fontFamily: "monospace",
            fontSize: "0.8rem",
          }}
        >
          {props.argument.type}
        </span>
        <ReactIcon
          id="CHEVRON"
          width={16}
          height={16}
          style={{ transform: "rotate(180deg)" }}
        />
        <ReactIcon
          id="CHEVRON"
          width={16}
          height={16}
          style={{ transform: "rotate(0deg)" }}
        />
        <ReactIcon id="TRASH" width={16} height={16} className="revert" />
        <ReactIcon
          id="CHEVRON"
          width={16}
          height={16}
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </div>
      <div
        className="property-grid"
        style={{
          display: expanded ? "" : "none",
          rowGap: "0.5rem",
          marginLeft: "1.5rem",
          marginTop: "0.5rem",
          backgroundColor: "var(--secondary-bg)",
          padding: "0.5rem",
          borderRadius: "4px",
        }}
      >
        <div className="label">Name</div>
        <TextInput
          value={props.argument.name}
          onChange={value => {
            props.argument.name = value
            props.setArgument({ ...props.argument })
          }}
        />
        <div className="label">Description</div>
        <MultilineTextInput
          value={props.argument.description}
          rows={2}
          onChange={value => {
            props.argument.description = value
          }}
        />
        <div className="label">Type</div>
        <DropdownInput
          values={["text", "checkbox", "color", "number", "dropdown", "slider"]}
          value={props.argument.type}
          onChange={value => {
            props.setArgument({
              ...DEFAULT_ARGUMENTS[value as CustomScriptArgument["type"]],
              name: props.argument.name,
              description: props.argument.description,
            })
          }}
        />
        {ARGUMENT_FIELDS[props.argument.type].map(field => {
          const f = field as CustomScriptArgumentField<
            Extract<CustomScriptArgument, { type: typeof props.argument.type }>
          >
          const input = resolveInput(f, props.argument)

          return (
            <Fragment key={field.name}>
              <div className="label">{field.name}</div>
              <ValueInput
                {...input}
                value={props.argument[f.key] as any}
                onChange={(value: any) => {
                  props.setArgument(prev => {
                    input.onChange?.(prev, value)
                    return {
                      ...prev,
                    }
                  })
                }}
              />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
