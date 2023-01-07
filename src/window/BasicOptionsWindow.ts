import { App } from "../App"
import { OPTIONS_WINDOW_DATA } from "../data/OptionsWindowData"
import { Window } from "./Window"

export class BasicOptionsWindow extends Window {
  optionsDataId = ""
  app: App

  constructor(app: App, optionsDataId: string) {
    super(OPTIONS_WINDOW_DATA[optionsDataId].window_options)
    this.app = app
    this.optionsDataId = optionsDataId
    this.initView(this.viewElement)
  }

  initView(viewElement: HTMLDivElement): void {
    viewElement.replaceChildren()
    viewElement.classList.add("options")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    OPTIONS_WINDOW_DATA[this.optionsDataId].view.forEach(entry => {
      const title = document.createElement("div")
      title.innerText =
        typeof entry.title == "function" ? entry.title(this.app) : entry.title
      title.classList.add("title")
      padding.appendChild(title)

      const section = document.createElement("div")
      section.classList.add("section")
      entry.options.forEach(option => {
        const container = document.createElement("div")
        container.classList.add("container")

        const label = document.createElement("div")
        label.classList.add("label")

        const item = option.element(this.app)
        label.innerText =
          typeof option.label == "function"
            ? option.label(this.app)
            : option.label

        container.appendChild(label)
        container.appendChild(item)

        section.appendChild(container)
      })
      padding.appendChild(section)
    })
    viewElement.appendChild(padding)
  }
}
