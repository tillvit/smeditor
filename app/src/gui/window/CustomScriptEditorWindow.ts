import { App } from "../../App"
import { CustomEditor } from "../../util/custom-script/CustomScriptEditor"
import { CustomScriptRunner } from "../../util/custom-script/CustomScriptRunner"
import { CustomScripts } from "../../util/custom-script/CustomScripts"
import { CustomScript } from "../../util/custom-script/CustomScriptTypes"
import { Themes } from "../../util/Theme"
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

    const createEditor = await import(
      "../../util/custom-script/CustomScriptEditor"
    ).then(m => m.createEditor)

    const editor = createEditor(
      this.scriptData!,
      script.tsCode,
      Themes.isDarkTheme() ? "dark" : "light"
    )
    const transpile = document.createElement("button")
    transpile.innerText = "Transpile & Save"
    transpile.onclick = async () => {
      const code = await editor.transpile()
      console.log(code)
    }
    this.scriptData!.appendChild(transpile)

    const run = document.createElement("button")
    run.innerText = "Run Script"
    run.style.marginLeft = "10px"
    run.onclick = async () => {
      this.currentScript!.tsCode = editor.getTS()
      this.currentScript!.jsCode = await editor.transpile()
      console.log(this.currentScript)
      CustomScriptRunner.run(this.app, this.currentScript!, {})
    }
    this.scriptData!.appendChild(run)

    this.scriptData!.style.width = "100%"
    this.scriptData!.style.height = "400px"

    this.currentEditor = editor
  }
}
