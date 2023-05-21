import { App } from "../../App"
import { SimfileProperty } from "../../chart/sm/SimfileTypes"
import { AUDIO_EXT, IMG_EXT } from "../../data/FileData"
import { SM_PROPERTIES_DATA } from "../../data/SMPropertiesData"
import { EventHandler } from "../../util/EventHandler"
import { FileHandler } from "../../util/FileHandler"
import { Icons } from "../Icons"
import { DirectoryWindow } from "./DirectoryWindow"
import { Window } from "./Window"

export class SMPropertiesWindow extends Window {
  app: App

  private changeHandler = () => this.initView()

  constructor(app: App) {
    super({
      title: "Song Properties",
      width: 450,
      height: 397,
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
        grid.appendChild(this.createInputElement(item.propName, item.type))
      })
      groupContainer.appendChild(title)
      groupContainer.appendChild(grid)
      padding.appendChild(groupContainer)
    })

    this.viewElement.appendChild(padding)
  }

  createInputElement(
    propName: SimfileProperty,
    type: "string" | "audio" | "image"
  ) {
    switch (type) {
      case "string": {
        const input = document.createElement("input")
        input.type = "text"
        input.autocomplete = "off"
        input.spellcheck = false
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          this.app.chartManager.loadedSM!.properties[propName] = input.value
        }
        input.value = this.app.chartManager.loadedSM!.properties[propName] ?? ""
        return input
      }
      case "audio":
      case "image": {
        const container = document.createElement("div")
        container.classList.add("flex-row", "flex-column-gap")
        const input = document.createElement("input")
        input.type = "text"
        input.autocomplete = "off"
        input.spellcheck = false
        input.placeholder = "click to select a file"
        input.onclick = ev => {
          ev.preventDefault()
          input.blur()
          const dir = this.app.chartManager.smPath
            .split("/")
            .slice(0, -1)
            .join("/")
          if (window.nw) {
            const fileSelector = document.createElement("input")
            fileSelector.type = "file"
            fileSelector.accept = type == "audio" ? "audio/*" : "image/*"
            fileSelector.onchange = () => {
              input.value = FileHandler.getRelativePath(dir, fileSelector.value)
              this.app.chartManager.loadedSM!.properties[propName] = input.value
            }
            fileSelector.click()
          } else {
            this.app.windowManager.openWindow(
              new DirectoryWindow(
                this.app,
                {
                  title:
                    type == "audio"
                      ? "Select an audio file..."
                      : "Select an image file...",
                  accepted_file_types: type == "audio" ? AUDIO_EXT : IMG_EXT,
                  disableClose: true,
                  callback: (path: string) => {
                    input.value = FileHandler.getRelativePath(dir, path)
                    this.app.chartManager.loadedSM!.properties[propName] =
                      input.value
                  },
                },
                this.app.chartManager.loadedSM!.properties[propName]
                  ? dir +
                    "/" +
                    this.app.chartManager.loadedSM!.properties[propName]
                  : this.app.chartManager.smPath
              )
            )
          }
        }
        input.value = this.app.chartManager.loadedSM!.properties[propName] ?? ""
        container.appendChild(input)
        const deleteButton = document.createElement("button")
        deleteButton.style.height = "100%"
        deleteButton.classList.add("delete")
        deleteButton.disabled = true
        deleteButton.onclick = () => {
          input.value = ""
          deleteButton.disabled = true
        }
        const icon = document.createElement("img")
        icon.classList.add("icon")
        icon.style.height = "12px"
        icon.src = Icons.TRASH
        deleteButton.appendChild(icon)
        container.appendChild(deleteButton)
        return container
      }
    }
  }
}
