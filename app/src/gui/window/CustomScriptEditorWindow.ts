import { App } from "../../App"
import {
  ARGUMENT_FIELDS,
  DEFAULT_ARGUMENTS,
} from "../../data/CustomScriptWindowData"
import { CustomEditor } from "../../util/custom-script/CustomScriptEditor"
import { CustomScripts } from "../../util/custom-script/CustomScripts"
import {
  CustomScript,
  CustomScriptArgument,
} from "../../util/custom-script/CustomScriptTypes"
import { Themes } from "../../util/Theme"
import { capitalize } from "../../util/Util"
import { createLabeledInput, ValueInput } from "../element/ValueInput"
import { Window } from "./Window"

export class CustomScriptEditorWindow extends Window {
  app: App
  private scriptList?: HTMLDivElement
  private scriptData?: HTMLDivElement
  private currentScript?: CustomScript
  private currentEditor?: CustomEditor
  // private gameTypeDropdown?: Dropdown<string>
  // private currentChart?: Chart
  // private smLoadHandler = () => {
  //   this.gameTypeDropdown!.setItems(
  //     GameTypeRegistry.getPriority().map(gameType => {
  //       const charts = this.getCharts(gameType)
  //       return gameType.id + " (" + charts.length + ")"
  //     })
  //   )
  //   this.gameTypeDropdown!.setSelected(
  //     this.gameType.id + " (" + this.getCharts(this.gameType).length + ") "
  //   )
  //   this.gameType = this.app.chartManager.loadedChart?.gameType ?? this.gameType
  //   this.loadCharts()
  // }
  // private chartModifiedHandler = () => {
  //   if (this.app.chartManager.loadedChart == this.currentChart) {
  //     this.loadChartDetails(this.app.chartManager.loadedChart)
  //   }
  // }

  constructor(app: App) {
    super({
      title: "Custom Scripts",
      width: 600,
      height: 500,
      win_id: "custom_scripts",
    })
    this.app = app
    this.initView()
  }

  onClose(): void {
    this.currentEditor?.destroy()
  }

  initView() {
    this.viewElement.replaceChildren()

    const padding = document.createElement("div")
    padding.classList.add("padding")

    const container = document.createElement("div")
    container.classList.add("custom-script-container")
    padding.appendChild(container)

    this.scriptList = document.createElement("div")
    this.scriptList.classList.add("custom-script-list")

    this.scriptData = document.createElement("div")
    this.scriptData.classList.add("custom-script-data")

    container.appendChild(this.scriptList)
    container.appendChild(this.scriptData)

    padding.appendChild(container)

    this.viewElement.appendChild(padding)

    this.loadScripts()
    this.loadScriptDetails()
  }

  private loadScripts() {
    const scripts = CustomScripts.scripts
    console.log(scripts)
    this.scriptList!.replaceChildren(
      ...scripts.map(script => {
        const scriptItem = document.createElement("div")
        scriptItem.classList.add("custom-script-item")
        scriptItem.innerText = script.name
        scriptItem.onclick = () => {
          this.loadScriptDetails(script)
        }
        return scriptItem
      })
    )
  }

  private async loadScriptDetails(script?: CustomScript) {
    this.currentEditor?.destroy()
    script = script ?? CustomScripts.scripts[0]
    if (!script) {
      this.scriptData!.replaceChildren()
      return
    }
    this.currentScript = script

    this.scriptData!.replaceChildren(
      this.createArgumentsTab(script),
      await this.createEditorTab(script)
    )
  }

  private createArgumentsTab(script: CustomScript) {
    const scriptArguments = document.createElement("div")
    script.arguments.forEach(arg => {
      const argument = document.createElement("div")

      const name = document.createElement("div")
      name.innerText = arg.name

      const editor = this.buildArgumentEditor(arg)
      argument.replaceChildren(name, editor)
      scriptArguments.appendChild(argument)
    })
    return scriptArguments
  }

  private buildArgumentEditor(arg: CustomScriptArgument) {
    const inputs = document.createElement("div")
    const nameInput = createLabeledInput(
      this.app,
      "Name",
      {
        type: "text",
        onChange: (_, value) => {
          arg.name = value
        },
      },
      arg.name
    )
    const descriptionInput = createLabeledInput(
      this.app,
      "Description",
      {
        type: "text",
        onChange: (_, value) => {
          arg.description = value
        },
      },
      arg.description
    )
    const typeInput = createLabeledInput(
      this.app,
      "Type",
      {
        type: "dropdown",
        items: ["Text", "Number", "Checkbox", "Color", "Dropdown", "Slider"],
        advanced: false,
        onChange: (_, value) => {
          const oldName = arg.name
          const oldDescription = arg.description
          const newType = (
            value as string
          ).toLowerCase() as CustomScriptArgument["type"]
          Object.keys(arg).forEach(key => {
            delete (arg as any)[key]
          })
          Object.assign(arg, DEFAULT_ARGUMENTS[newType])
          arg.name = oldName
          arg.description = oldDescription
          console.log(arg)
          loadTypeSpecificInputs(arg)
        },
      },
      capitalize(arg.type)
    )

    const loadTypeSpecificInputs = <Type extends CustomScriptArgument["type"]>(
      arg: Extract<CustomScriptArgument, { type: Type }>
    ) => {
      inputs.replaceChildren(nameInput, descriptionInput, typeInput)
      const fields = ARGUMENT_FIELDS[arg.type]
      fields.forEach(field => {
        const fieldInput =
          typeof field.input == "function" ? field.input(arg) : field.input
        const inputOnChange = fieldInput.onChange
        const input = createLabeledInput(
          this.app,
          field.name,
          {
            ...fieldInput,
            onChange: (_: App, value: any) => {
              inputOnChange(arg, value)
              if (field.reload) {
                console.log("reloading", arg)
                loadTypeSpecificInputs(arg)
              }
            },
          } as Extract<ValueInput<any>, { type: Type }>,
          field.getValue(arg)
        )
        inputs.appendChild(input)
      })
    }

    loadTypeSpecificInputs(arg)
    return inputs
  }

  private async createEditorTab(script: CustomScript) {
    this.currentEditor?.destroy()
    const editorTab = document.createElement("div")
    editorTab.style.width = "100%"
    editorTab.style.height = "100%"

    const createEditor = await import(
      "../../util/custom-script/CustomScriptEditor"
    ).then(m => m.createEditor)

    const editor = createEditor(
      editorTab,
      script.tsCode,
      Themes.isDarkTheme() ? "dark" : "light"
    )
    this.currentScript

    // const run = document.createElement("button")
    // run.innerText = "Run Script"
    // run.style.marginLeft = "10px"
    // run.onclick = async () => {
    //   this.currentScript!.tsCode = editor.getTS()
    //   this.currentScript!.jsCode = await editor.transpile()
    //   console.log(this.currentScript)
    //   CustomScriptRunner.run(this.app, this.currentScript!, {})
    // }
    // this.scriptData!.appendChild(run)

    this.scriptData!.style.width = "100%"
    this.scriptData!.style.height = "400px"

    this.currentEditor = editor

    return editorTab
  }
}
