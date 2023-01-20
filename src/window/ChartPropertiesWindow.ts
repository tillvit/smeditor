import { App } from "../App"
import { CHART_PROPERTIES_WINDOW_DATA } from "../data/ChartPropertiesWindowData"
import { EventHandler } from "../util/EventHandler"
import { Window } from "./Window"

export class ChartPropertiesWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "Chart Properties",
      width: 400,
      height: 220,
      disableClose: false,
      win_id: "chart_properties",
      blocking: false,
    })
    this.app = app
    this.initView(this.viewElement)
    EventHandler.on("chartLoaded", () => this.initView(this.viewElement))
    EventHandler.on("undo", () => {
      this.initView(this.viewElement)
    })
    EventHandler.on("redo", () => {
      this.initView(this.viewElement)
    })
  }

  initView(viewElement: HTMLDivElement): void {
    viewElement.replaceChildren()
    viewElement.classList.add("chart-properties")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    const songLabel = document.createElement("div")
    songLabel.classList.add("label")
    songLabel.innerText = "Apply to"

    Object.values(CHART_PROPERTIES_WINDOW_DATA).forEach(entry => {
      const label = document.createElement("div")
      label.classList.add("label")
      label.innerText = entry.title

      const item = entry.element(this.app)

      padding.appendChild(label)
      padding.appendChild(item)
    })
    viewElement.appendChild(padding)
  }
}
