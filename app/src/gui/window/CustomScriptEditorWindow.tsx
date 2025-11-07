// import { App } from "../../App"
// import {
//   ARGUMENT_FIELDS,
//   DEFAULT_ARGUMENTS,
// } from "../../data/CustomScriptWindowData"
// import { CustomEditor } from "../../util/custom-script/CustomScriptEditor"
// import { CustomScripts } from "../../util/custom-script/CustomScripts"
// import {
//   CustomScript,
//   CustomScriptArgument,
// } from "../../util/custom-script/CustomScriptTypes"
// import { Themes } from "../../util/Theme"
// import { capitalize } from "../../util/Util"
// import { createLabeledInput, ValueInput } from "../element/ValueInput"
// import { _Window } from "./Window"
// import { WindowData } from "./WindowManager"

import { Editor } from "@monaco-editor/react"
import { editor } from "monaco-editor"
import { useContext, useEffect, useRef, useState } from "react"
import { initializeMonaco } from "../../util/custom-script/CustomScriptEditor"
import { CustomScriptRunner } from "../../util/custom-script/CustomScriptRunner"
import { Themes } from "../../util/Theme"
import { WindowContext, WindowData } from "./WindowManager"

// export class _CustomScriptEditorWindow extends _Window {
//   app: App
//   private scriptList?: HTMLDivElement
//   private scriptData?: HTMLDivElement
//   private currentScript?: CustomScript
//   private currentEditor?: CustomEditor
//   // private gameTypeDropdown?: Dropdown<string>
//   // private currentChart?: Chart
//   // private smLoadHandler = () => {
//   //   this.gameTypeDropdown!.setItems(
//   //     GameTypeRegistry.getPriority().map(gameType => {
//   //       const charts = this.getCharts(gameType)
//   //       return gameType.id + " (" + charts.length + ")"
//   //     })
//   //   )
//   //   this.gameTypeDropdown!.setSelected(
//   //     this.gameType.id + " (" + this.getCharts(this.gameType).length + ") "
//   //   )
//   //   this.gameType = this.app.chartManager.loadedChart?.gameType ?? this.gameType
//   //   this.loadCharts()
//   // }
//   // private chartModifiedHandler = () => {
//   //   if (this.app.chartManager.loadedChart == this.currentChart) {
//   //     this.loadChartDetails(this.app.chartManager.loadedChart)
//   //   }
//   // }

//   constructor(app: App) {
//     super({
//       title: "Custom Scripts",
//       width: 600,
//       height: 500,
//       win_id: "custom_scripts",
//     })
//     this.app = app
//     this.initView()
//   }

//   onClose(): void {
//     this.currentEditor?.destroy()
//   }

//   initView() {
//     this.viewElement.replaceChildren()

//     const padding = document.createElement("div")
//     padding.classList.add("padding")

//     const container = document.createElement("div")
//     container.classList.add("custom-script-container")
//     padding.appendChild(container)

//     this.scriptList = document.createElement("div")
//     this.scriptList.classList.add("custom-script-list")

//     this.scriptData = document.createElement("div")
//     this.scriptData.classList.add("custom-script-data")

//     container.appendChild(this.scriptList)
//     container.appendChild(this.scriptData)

//     padding.appendChild(container)

//     this.viewElement.appendChild(padding)

//     this.loadScripts()
//     this.loadScriptDetails()
//   }

//   private loadScripts() {
//     const scripts = CustomScripts.scripts
//     console.log(scripts)
//     this.scriptList!.replaceChildren(
//       ...scripts.map(script => {
//         const scriptItem = document.createElement("div")
//         scriptItem.classList.add("custom-script-item")
//         scriptItem.innerText = script.name
//         scriptItem.onclick = () => {
//           this.loadScriptDetails(script)
//         }
//         return scriptItem
//       })
//     )
//   }

//   private async loadScriptDetails(script?: CustomScript) {
//     this.currentEditor?.destroy()
//     script = script ?? CustomScripts.scripts[0]
//     if (!script) {
//       this.scriptData!.replaceChildren()
//       return
//     }
//     this.currentScript = script

//     this.scriptData!.replaceChildren(
//       this.createArgumentsTab(script),
//       await this.createEditorTab(script)
//     )
//   }

//   private createArgumentsTab(script: CustomScript) {
//     const scriptArguments = document.createElement("div")
//     script.arguments.forEach(arg => {
//       const argument = document.createElement("div")

//       const name = document.createElement("div")
//       name.innerText = arg.name

//       const editor = this.buildArgumentEditor(arg)
//       argument.replaceChildren(name, editor)
//       scriptArguments.appendChild(argument)
//     })
//     return scriptArguments
//   }

//   private buildArgumentEditor(arg: CustomScriptArgument) {
//     const inputs = document.createElement("div")
//     const nameInput = createLabeledInput(
//       this.app,
//       "Name",
//       {
//         type: "text",
//         onChange: (_, value) => {
//           arg.name = value
//         },
//       },
//       arg.name
//     )
//     const descriptionInput = createLabeledInput(
//       this.app,
//       "Description",
//       {
//         type: "text",
//         onChange: (_, value) => {
//           arg.description = value
//         },
//       },
//       arg.description
//     )
//     const typeInput = createLabeledInput(
//       this.app,
//       "Type",
//       {
//         type: "dropdown",
//         items: ["Text", "Number", "Checkbox", "Color", "Dropdown", "Slider"],
//         advanced: false,
//         onChange: (_, value) => {
//           const oldName = arg.name
//           const oldDescription = arg.description
//           const newType = (
//             value as string
//           ).toLowerCase() as CustomScriptArgument["type"]
//           Object.keys(arg).forEach(key => {
//             delete (arg as any)[key]
//           })
//           Object.assign(arg, DEFAULT_ARGUMENTS[newType])
//           arg.name = oldName
//           arg.description = oldDescription
//           console.log(arg)
//           loadTypeSpecificInputs(arg)
//         },
//       },
//       capitalize(arg.type)
//     )

//     const loadTypeSpecificInputs = <Type extends CustomScriptArgument["type"]>(
//       arg: Extract<CustomScriptArgument, { type: Type }>
//     ) => {
//       inputs.replaceChildren(nameInput, descriptionInput, typeInput)
//       const fields = ARGUMENT_FIELDS[arg.type]
//       fields.forEach(field => {
//         const fieldInput =
//           typeof field.input == "function" ? field.input(arg) : field.input
//         const inputOnChange = fieldInput.onChange
//         const input = createLabeledInput(
//           this.app,
//           field.name,
//           {
//             ...fieldInput,
//             onChange: (_: App, value: any) => {
//               inputOnChange(arg, value)
//               if (field.reload) {
//                 console.log("reloading", arg)
//                 loadTypeSpecificInputs(arg)
//               }
//             },
//           } as Extract<ValueInput<any>, { type: Type }>,
//           field.getValue(arg)
//         )
//         inputs.appendChild(input)
//       })
//     }

//     loadTypeSpecificInputs(arg)
//     return inputs
//   }

//   private async createEditorTab(script: CustomScript) {
//     this.currentEditor?.destroy()
//     const editorTab = document.createElement("div")
//     editorTab.style.width = "100%"
//     editorTab.style.height = "100%"

//     const createEditor = await import(
//       "../../util/custom-script/CustomScriptEditor"
//     ).then(m => m.createEditor)

//     const editor = createEditor(
//       editorTab,
//       script.tsCode,
//       Themes.isDarkTheme() ? "dark" : "light"
//     )
//     this.currentScript

//     // const run = document.createElement("button")
//     // run.innerText = "Run Script"
//     // run.style.marginLeft = "10px"
//     // run.onclick = async () => {
//     //   this.currentScript!.tsCode = editor.getTS()
//     //   this.currentScript!.jsCode = await editor.transpile()
//     //   console.log(this.currentScript)
//     //   CustomScriptRunner.run(this.app, this.currentScript!, {})
//     // }
//     // this.scriptData!.appendChild(run)

//     this.scriptData!.style.width = "100%"
//     this.scriptData!.style.height = "400px"

//     this.currentEditor = editor

//     return editorTab
//   }
// }

const LOG_COLORS = {
  log: {
    background: "",
    text: "",
  },
  error: {
    background: "#660000",
    text: "#ffaaaa",
  },
  warn: {
    background: "#665500",
    text: "#ffffaa",
  },
  info: {
    background: "#004466",
    text: "#aaffff",
  },
}

function CustomScriptEditorContent() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)
  const app = useContext(WindowContext)!.app
  const worker = useRef<Worker | null>(null)
  const [logs, setLogs] = useState<
    ["log" | "error" | "warn" | "info", string][]
  >([])

  function toString(object: any) {
    if (typeof object === "string") return object
    try {
      return JSON.stringify(object)
    } catch (e) {
      return String(object)
    }
  }

  async function run() {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    setLogs([])
    console.log(editor.getModel()?.getValue())
    const client = await monaco.languages.typescript
      .getTypeScriptWorker()
      .then(worker => worker())
    const result = await client.getEmitOutput("file:///main.ts")
    console.log(result.outputFiles[0].text)
    const w = CustomScriptRunner.run(
      app,
      {
        name: "Custom Script",
        tsCode: editor.getModel()?.getValue() ?? "",
        jsCode: result.outputFiles[0].text,
        description: "",
        keybinds: [],
        arguments: [],
      },
      {},
      (type, ...args) => {
        setLogs(oldLogs => [...oldLogs, [type, args.map(toString).join(" ")]])
      }
    )
    if (!w) return
    worker.current = w
  }

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.getDomNode()?.contains(e.target as HTMLElement))
        return
      console.log(e.key)
      if (e.key === "'" || e.key === '"') {
        setTimeout(() => {
          editorRef.current?.trigger("", "editor.action.triggerSuggest", {
            auto: true,
          })
        }, 100)
      }
    }
    document.addEventListener("keydown", keyDown)
    return () => {
      document.removeEventListener("keydown", keyDown)
    }
  }, [editorRef.current])

  return (
    <div className="flex-column-full">
      <Editor
        defaultLanguage="typescript"
        beforeMount={monaco => {
          initializeMonaco(monaco)
          monacoRef.current = monaco
        }}
        onMount={e => {
          editorRef.current = e
          e.addCommand(
            monacoRef.current!.KeyMod.WinCtrl | monacoRef.current!.KeyCode.KeyM,
            () =>
              editorRef.current?.trigger("", "editor.action.triggerSuggest", {})
          )
        }}
        path="main.ts"
        theme={Themes.isDarkTheme() ? "dark" : "light"}
        options={{
          fixedOverflowWidgets: true,
          automaticLayout: true,
          minimap: { enabled: false },
          "semanticHighlighting.enabled": true,
        }}
        defaultValue="// the scripter"
      />
      <div>Console</div>
      <pre
        style={{
          height: "150px",
          overflowY: "auto",
          backgroundColor: "#1e1e1e",
          color: "white",
          margin: "0",
          padding: "0.5rem",
          fontSize: "0.675rem",
        }}
      >
        {logs.map(([type, message], i) => {
          const { background, text } = LOG_COLORS[type]
          return (
            <div
              key={i}
              style={{
                backgroundColor: background,
                color: text,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {message}
            </div>
          )
        })}
      </pre>
      <button onClick={run}>Test</button>
    </div>
  )
}

export function CustomScriptEditorWindow(): WindowData {
  return {
    title: "Custom Scripts",
    width: 600,
    height: 500,
    id: "custom-scripts",
    content: <CustomScriptEditorContent />,
  }
}
