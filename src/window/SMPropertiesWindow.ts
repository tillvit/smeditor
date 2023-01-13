import { App } from "../App"
import { SM_PROPERTIES_WINDOW_DATA } from "../data/SMPropertiesWindowData"
import { Window } from "./Window"

export class SMPropertiesWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "SM Properties",
      width: 400,
      height: 290,
      disableClose: false,
      win_id: "sm_properties",
      blocking: false,
    })
    this.app = app
    this.initView(this.viewElement)
    window.onmessage = message => {
      if (message.data == "chartLoaded" && message.source == window) {
        this.initView(this.viewElement)
      }
    }
  }

  initView(viewElement: HTMLDivElement): void {
    viewElement.replaceChildren()
    viewElement.classList.add("chart-properties")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    const songLabel = document.createElement("div")
    songLabel.classList.add("label")
    songLabel.innerText = "Apply to"

    Object.values(SM_PROPERTIES_WINDOW_DATA).forEach(entry => {
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
