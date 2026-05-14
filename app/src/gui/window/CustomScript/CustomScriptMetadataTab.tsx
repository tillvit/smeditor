import { Dispatch, SetStateAction } from "react"
import { CustomScripts } from "../../../util/custom-script/CustomScripts"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"
import { MultilineTextInput } from "../../inputs/MultilineTextInput"
import { TextInput } from "../../inputs/TextInput"
import { CustomScriptArgumentComponent } from "./CustomScriptArgumentComponent"

export function CustomScriptMetadataTab(props: {
  scriptIndex: number | null
  scripts: CustomScript[]
  setScripts: Dispatch<SetStateAction<CustomScript[]>>
}) {
  const script =
    props.scriptIndex !== null ? props.scripts[props.scriptIndex] : null

  if (!script) {
    return <div className="flex-column-full center">No script selected</div>
  }

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
              props.setScripts(prev => [...prev])
              CustomScripts.saveCustomScripts()
            }}
          />
          <div className="label">Description</div>
          <MultilineTextInput
            value={script.description}
            onChange={val => {
              script.description = val
              props.setScripts(prev => [...prev])
              CustomScripts.saveCustomScripts()
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
              key={index}
              setArgument={newArg => {
                props.setScripts(prev => {
                  const updatedScripts = [...prev]
                  updatedScripts[props.scriptIndex!].arguments[index] =
                    typeof newArg == "function"
                      ? newArg(
                          updatedScripts[props.scriptIndex!].arguments[index]
                        )
                      : newArg
                  CustomScripts.saveCustomScripts()
                  return updatedScripts
                })
              }}
              removeArgument={() => {
                props.setScripts(prev => {
                  const updatedScripts = [...prev]
                  updatedScripts[props.scriptIndex!].arguments.splice(index, 1)
                  CustomScripts.saveCustomScripts()
                  return updatedScripts
                })
              }}
            />
          ))}
          <button
            onClick={() => {
              props.setScripts(prev => {
                const updatedScripts = [...prev]
                let i = 1
                while (
                  updatedScripts[props.scriptIndex!].arguments.find(
                    arg =>
                      arg.name === "New Argument" + (i === 1 ? "" : " " + i)
                  )
                ) {
                  i++
                }
                updatedScripts[props.scriptIndex!].arguments.push({
                  name: "New Argument" + (i === 1 ? "" : " " + i),
                  description: "",
                  type: "number",
                  default: 0,
                  min: 0,
                  max: 10,
                  step: 1,
                  precision: 0,
                })
                CustomScripts.saveCustomScripts()
                return updatedScripts
              })
            }}
          >
            Add Argument
          </button>
        </div>
      </div>
    </div>
  )
}
