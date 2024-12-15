import { App } from "../../App"
import {
  SM_PROPERTIES_DATA,
  createInputElement,
} from "../../data/SMPropertiesData"
import { EventHandler } from "../../util/EventHandler"
import { Window } from "./Window"

export class SMPropertiesWindow extends Window {
  app: App

  private changeHandler = () => this.initView()

  constructor(app: App) {
    super({
      title: "Song Properties",
      width: 450,
      height: 486,
      disableClose: false,
      win_id: "sm_properties",
      blocking: false,
    })
    this.app = app
    this.initView()
    EventHandler.on("smLoaded", this.changeHandler)
    EventHandler.on("undo", this.changeHandler)
    EventHandler.on("redo", this.changeHandler)
  }

  onClose(): void {
    EventHandler.off("smLoaded", this.changeHandler)
    EventHandler.off("undo", this.changeHandler)
    EventHandler.off("redo", this.changeHandler)
  }

  initView(): void {
    this.viewElement.replaceChildren()
    this.viewElement.classList.add("sm-properties")
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const songLabel = document.createElement("div")
    songLabel.classList.add("label")
    songLabel.innerText = "Apply to"

    SM_PROPERTIES_DATA.forEach(group => {
      const groupContainer = document.createElement("div")
      groupContainer.classList.add("sm-container")

      const title = document.createElement("div")
      title.classList.add("sm-title")
      title.innerText = group.title

      const grid = document.createElement("div")
      grid.classList.add("property-grid")

      group.items.forEach(item => {
        const label = document.createElement("div")
        label.classList.add("label")
        label.innerText = item.title

        grid.appendChild(label)
        grid.appendChild(
          createInputElement(this.app, this.app.chartManager.loadedSM!, item)
        )
      })
      groupContainer.appendChild(title)
      groupContainer.appendChild(grid)
      padding.appendChild(groupContainer)
    })

    this.viewElement.appendChild(padding)
  }
}
