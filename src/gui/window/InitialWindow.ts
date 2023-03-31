import { App } from "../../App"
import { INITIAL_WINDOW_DATA } from "../../data/InitalWindowData"
import { Window } from "./Window"

export class InitialWindow extends Window {
  app: App

  constructor(app: App) {
    super(INITIAL_WINDOW_DATA.window_options)
    this.app = app
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    this.viewElement.classList.add("options")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    INITIAL_WINDOW_DATA.view.forEach(entry => {
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
    this.viewElement.appendChild(padding)
  }
}
