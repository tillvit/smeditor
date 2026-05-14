import { Dispatch, SetStateAction } from "react"
import { CustomScripts } from "../../../util/custom-script/CustomScripts"
import {
  CustomScript,
  CustomScriptUploadSchema,
} from "../../../util/custom-script/CustomScriptTypes"
import { tippySafe } from "../../../util/Util"
import { WaterfallManager } from "../../element/WaterfallManager"
import { ReactIcon } from "../../Icons"
import { ConfirmationWindow } from "../Confirmation/ConfirmationWindow"
import { WindowManager } from "../WindowManager"

export function CustomScriptSelector(props: {
  scriptIndex: number | null
  setScriptIndex: Dispatch<SetStateAction<number | null>>
  scripts: CustomScript[]
  setScripts: Dispatch<SetStateAction<CustomScript[]>>
}) {
  return (
    <div className="flex-column-full" style={{ width: "10rem", gap: "0.5rem" }}>
      <div
        className="custom-script-selector"
        onClick={() => props.setScriptIndex(null)}
      >
        {props.scripts.map((script, index) => (
          <div
            key={index + "-" + script.name}
            className={`custom-script-option ${props.scriptIndex === index ? "selected" : ""}`}
            onClick={e => {
              props.setScriptIndex(index)
              e.stopPropagation()
            }}
          >
            {script.name}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
        <button
          ref={el => {
            if (el) {
              tippySafe(el, { content: "New script" })
            }
          }}
          onClick={() => {
            props.setScripts(prev => {
              let i = 1
              while (
                prev.some(s => s.name === `New Script` + (i > 1 ? ` ${i}` : ""))
              ) {
                i++
              }
              const newScript = {
                name: "New Script" + (i > 1 ? ` ${i}` : ""),
                description: "",
                arguments: [],
                tsCode: "",
                jsCode: "",
                code: "",
              }
              const newScripts = [...prev, newScript]
              CustomScripts.scripts.push(newScript)
              CustomScripts.saveCustomScripts()
              props.setScriptIndex(newScripts.length - 1)
              return newScripts
            })
          }}
        >
          <ReactIcon id="PLUS" width={16} height={16} />
        </button>
        <button
          ref={el => {
            if (el) {
              tippySafe(el, { content: "Delete script" })
            }
          }}
          className="delete"
          disabled={props.scriptIndex === null}
          onClick={() => {
            const confirmWindow = ConfirmationWindow({
              title: "Delete Script",
              message: "Are you sure you want to delete this script?",
              buttonOptions: [
                {
                  label: "Cancel",
                  callback: () => {},
                  type: "default",
                },
                {
                  label: "Delete",
                  callback: () => {
                    props.setScripts(() => {
                      CustomScripts.scripts.splice(props.scriptIndex!, 1)
                      props.setScriptIndex(null)
                      CustomScripts.saveCustomScripts()
                      return [...CustomScripts.scripts]
                    })
                  },
                  type: "delete",
                },
              ],
            })
            WindowManager.openWindow(confirmWindow)
          }}
        >
          <ReactIcon id="TRASH" width={16} height={16} />
        </button>
        <button
          ref={el => {
            if (el) {
              tippySafe(el, { content: "Upload script" })
            }
          }}
          onClick={() => {
            const confirmWindow = ConfirmationWindow({
              title: "Upload Script",
              message:
                "Script files contain arbitrary code and can be dangerous. Only upload scripts from sources you trust.Are you sure you want to upload a script?",
              buttonOptions: [
                {
                  label: "Cancel",
                  callback: () => {},
                  type: "default",
                },
                {
                  label: "Ok",
                  callback: () => {
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = ".json"
                    input.onchange = e => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        try {
                          const json = JSON.parse(reader.result as string)
                          const schema = CustomScriptUploadSchema.parse(json)
                          const newScript: CustomScript = {
                            name: schema.name,
                            description: schema.description,
                            arguments: schema.arguments,
                            tsCode: schema.code,
                            jsCode: null,
                          }
                          props.setScripts(prev => {
                            const newScripts = [...prev, newScript]
                            CustomScripts.scripts.push(newScript)
                            CustomScripts.saveCustomScripts()
                            props.setScriptIndex(newScripts.length - 1)
                            return newScripts
                          })
                        } catch (err) {
                          WaterfallManager.createFormatted(
                            "Invalid script file!",
                            "error"
                          )
                          console.error(err)
                        }
                      }
                      reader.readAsText(file)
                    }
                    input.click()
                  },
                  type: "confirm",
                },
              ],
            })
            WindowManager.openWindow(confirmWindow)
          }}
        >
          <ReactIcon id="UPLOAD" width={16} height={16} />
        </button>
        <button
          ref={el => {
            if (el) {
              tippySafe(el, { content: "Download script" })
            }
          }}
          onClick={() => {
            if (!props.scriptIndex) return
            const script = props.scripts[props.scriptIndex]
            if (!script) return
            const element = document.createElement("a")
            const file = new Blob(
              [
                JSON.stringify(
                  {
                    name: script.name,
                    description: script.description,
                    arguments: script.arguments,
                    code: script.tsCode,
                  },
                  null,
                  2
                ),
              ],
              {
                type: "application/json",
              }
            )
            element.href = URL.createObjectURL(file)
            element.download = script.name + ".json"
            document.body.appendChild(element)
            element.click()
            element.remove()
          }}
          disabled={props.scriptIndex === null}
        >
          <ReactIcon id="DOWNLOAD" width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
