import { App } from "../../App"
import { Simfile } from "../../chart/sm/Simfile"
import { SimfileProperty } from "../../chart/sm/SimfileTypes"
import { DEFAULT_SM } from "../../data/SMData"
import {
  SM_PROPERTIES_DATA,
  createInputElement,
} from "../../data/SMPropertiesData"
import { ActionHistory } from "../../util/ActionHistory"
import { FileHandler } from "../../util/file-handler/FileHandler"
import { Icons } from "../Icons"
import { WaterfallManager } from "../element/WaterfallManager"
import { ConfirmationWindow } from "./ConfirmationWindow"
import { Window } from "./Window"

export class NewSongWindow extends Window {
  app: App

  private sm: Simfile
  private actionHistory: ActionHistory
  private fileTable: { [key: string]: File } = {}

  constructor(app: App) {
    super({
      title: "New Song",
      width: 450,
      height: 492,
      disableClose: true,
      win_id: "sm_properties",
      blocking: true,
    })

    //Make a new SM
    const blob = new Blob([DEFAULT_SM], { type: "text/plain" })
    const file = new File([blob], "song.sm", { type: "text/plain" })
    this.sm = new Simfile(file)
    this.app = app
    this.actionHistory = new ActionHistory(this.app)
    this.initView()
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
        if (item.input.type == "file")
          grid.appendChild(
            this.createFileElement(item.propName, item.input.typeName)
          )
        else
          grid.appendChild(
            createInputElement(this.app, item, this.sm, this.actionHistory)
          )
      })
      groupContainer.appendChild(title)
      groupContainer.appendChild(grid)
      padding.appendChild(groupContainer)
    })

    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const menu_options_left = document.createElement("div")
    menu_options_left.classList.add("menu-left")
    const menu_options_right = document.createElement("div")
    menu_options_right.classList.add("menu-right")
    menu_options.appendChild(menu_options_left)
    menu_options.appendChild(menu_options_right)

    const cancel = document.createElement("button")
    cancel.innerText = "Cancel"
    cancel.onclick = () => {
      this.closeWindow()
    }

    const create_btn = document.createElement("button")
    create_btn.innerText = "Create"
    create_btn.classList.add("confirm")
    create_btn.onclick = () => {
      if (
        this.sm.properties.MUSIC === undefined ||
        this.sm.properties.MUSIC === ""
      ) {
        this.app.windowManager.openWindow(
          new ConfirmationWindow(
            this.app,
            "No audio file uploaded",
            "Are you sure you want to create a file with no audio?",
            [
              {
                type: "confirm",
                label: "Yes",
                callback: () => {
                  this.createSong()
                  this.closeWindow()
                },
              },
              {
                type: "default",
                label: "No",
              },
            ]
          )
        )
      } else {
        this.createSong()
        this.closeWindow()
      }
    }
    menu_options_left.appendChild(cancel)
    menu_options_right.appendChild(create_btn)
    padding.appendChild(menu_options)
    this.viewElement.appendChild(padding)
  }

  async createSong() {
    let folder = this.sm.properties.TITLE!
    if (window.nw) {
      const fileSelector = document.createElement("input")
      fileSelector.type = "file"
      // fileSelector.nwdirectory = true
      // fileSelector.nwdirectorydesc = "hi"
      fileSelector.onchange = () => {
        WaterfallManager.create(fileSelector.value)
        console.log(fileSelector.value)
      }
      fileSelector.click()
    } else {
      if (await FileHandler.getDirectoryHandle(folder)) {
        let i = 2
        while (await FileHandler.getDirectoryHandle(folder)) {
          folder = `${this.sm.properties.TITLE!} ${i++}`
        }
      }
    }
    await FileHandler.writeFile(folder + "/song.sm", this.sm.serialize("sm"))
    // Add the rest of the files
    await Promise.all(
      Object.entries(this.fileTable).map(entry =>
        FileHandler.writeFile(folder + `/${entry[0]}`, entry[1])
      )
    )
    await this.app.chartManager.loadSM(folder + "/song.sm")
    this.app.windowManager?.getWindowById("select_sm_initial")?.closeWindow()
  }

  isValid() {
    return (
      this.sm.properties.TITLE !== undefined &&
      this.sm.properties.TITLE !== "" &&
      this.sm.properties.MUSIC !== undefined &&
      this.sm.properties.MUSIC !== ""
    )
  }

  createFileElement(propName: SimfileProperty, typeName: string) {
    const container = document.createElement("div")
    container.classList.add("flex-row", "flex-column-gap")
    const input = document.createElement("input")
    input.type = "text"
    input.autocomplete = "off"
    input.spellcheck = false
    input.placeholder = "click to upload a file"
    input.onclick = ev => {
      ev.preventDefault()
      input.blur()
      const fileSelector = document.createElement("input")
      fileSelector.type = "file"
      fileSelector.accept = typeName == "audio" ? "audio/*" : "image/*"
      fileSelector.onchange = () => {
        const file = fileSelector.files?.[0]
        if (!file) return

        // Remove the old file
        if (
          this.sm.properties[propName] &&
          this.fileTable[this.sm.properties[propName]!]
        ) {
          delete this.fileTable[this.sm.properties[propName]!]
        }

        let fileName = file.name
        // Prevent file conflicts. Same file is ok, but same name different file not ok
        while (
          this.fileTable[file.name] &&
          (this.fileTable[file.name].size != file.size ||
            this.fileTable[file.name].type != file.type)
        ) {
          fileName = "_" + fileName
        }
        this.fileTable[fileName] = file
        input.value = fileName
        this.sm.properties[propName] = input.value
        deleteButton.disabled = false
      }
      fileSelector.click()
    }
    input.value = this.sm.properties[propName] ?? ""
    container.appendChild(input)

    const deleteButton = document.createElement("button")
    deleteButton.style.height = "100%"
    deleteButton.classList.add("delete")
    deleteButton.disabled = true
    deleteButton.onclick = () => {
      if (
        this.sm.properties[propName] &&
        this.fileTable[this.sm.properties[propName]!]
      ) {
        delete this.fileTable[this.sm.properties[propName]!]
      }
      this.sm.properties[propName] = undefined
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
