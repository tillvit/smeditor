import { Dispatch, SetStateAction } from "react"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"
import { MultilineTextInput } from "../../inputs/MultilineTextInput"
import { TextInput } from "../../inputs/TextInput"
import { CustomScriptArgumentComponent } from "./CustomScriptArgumentComponent"

export function CustomScriptMetadataTab(props: {
  scriptIndex: number
  scripts: CustomScript[]
  setScripts: Dispatch<SetStateAction<CustomScript[]>>
}) {
  const script = props.scripts[props.scriptIndex]

  return (
    <div className="flex-column-full">
      <div className="">
        <div className="property-title">Metadata</div>
        <div className="property-grid">
          <div className="label">Name</div>
          <TextInput
            value={script.name}
            onChange={val => {
              script.name = val
            }}
          />
          <div className="label">Description</div>
          <MultilineTextInput
            value={script.description}
            onChange={val => {
              script.description = val
            }}
          />
        </div>
      </div>
      <div className="" style={{ flex: 1, height: 0 }}>
        <div className="property-title">Arguments</div>
        <div
          className="flex-column-full"
          style={{
            overflowY: "auto",
            height: "100%",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          {script.arguments.map((arg, index) => (
            <CustomScriptArgumentComponent
              argument={arg}
              key={index + "-" + arg.name}
              setArgument={newArg => {
                props.setScripts(prev => {
                  const updatedScripts = [...prev]
                  updatedScripts[props.scriptIndex].arguments[index] =
                    typeof newArg == "function"
                      ? newArg(
                          updatedScripts[props.scriptIndex].arguments[index]
                        )
                      : newArg
                  return updatedScripts
                })
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
