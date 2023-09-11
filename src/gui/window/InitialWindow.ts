import scrollIntoView from "scroll-into-view-if-needed"
import { App } from "../../App"

import { RecentFileHandler } from "../../util/RecentFileHandler"
import { Icons } from "../Icons"
import { DirectoryWindow } from "./DirectoryWindow"
import { NewSongWindow } from "./NewSongWindow"
import { Window } from "./Window"

export class InitialWindow extends Window {
  app: App

  private keyHandler

  constructor(app: App) {
    super({
      title: "Open a Song",
      width: 400,
      height: 320,
      disableClose: true,
      win_id: "select_sm_initial",
    })
    this.app = app
    this.keyHandler = this.handleKeyEvent.bind(this)
    window.addEventListener("keydown", this.keyHandler)
    this.initView()
  }

  onClose(): void {
    window.removeEventListener("keydown", this.keyHandler)
  }

  initView(): void {
    this.viewElement.replaceChildren()
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const openContainer = document.createElement("div")
    openContainer.classList.add("open-container")
    padding.appendChild(openContainer)

    const topContainer = document.createElement("div")
    topContainer.classList.add("top-container")
    const seperator = document.createElement("div")
    seperator.classList.add("seperator")
    seperator.style.margin = "10px"
    const bottomContainer = document.createElement("div")
    bottomContainer.classList.add("bottom-container")
    openContainer.appendChild(topContainer)
    openContainer.appendChild(seperator)
    openContainer.appendChild(bottomContainer)

    const openButton = document.createElement("button")
    openButton.style.display = "flex"
    openButton.style.flexDirection = "column"
    openButton.style.padding = "10px"
    openButton.style.backgroundColor = "#414352"
    topContainer.appendChild(openButton)

    const openIcon = document.createElement("img")
    openIcon.src = Icons.UPLOAD
    openIcon.classList.add("icon")
    openIcon.style.width = "30px"
    openIcon.style.height = "30px"
    openButton.appendChild(openIcon)

    const openTitle = document.createElement("div")
    openTitle.innerText = window.nw
      ? "Open an existing song"
      : "Import a song folder"
    openButton.appendChild(openTitle)

    openButton.onclick = () => {
      if (window.nw) {
        const fileSelector = document.createElement("input")
        fileSelector.type = "file"
        fileSelector.accept = ".sm,.ssc"
        fileSelector.onchange = () => {
          this.app.chartManager.loadSM(fileSelector.value)
          this.closeWindow()
        }
        fileSelector.click()
      } else {
        this.app.windowManager.openWindow(
          new DirectoryWindow(this.app, {
            title: "Select an sm/ssc file...",
            accepted_file_types: [".sm", ".ssc"],
            disableClose: true,
            callback: (path: string) => {
              this.app.chartManager.loadSM(path)
              this.closeWindow()
            },
          })
        )
      }
    }
    const newButton = document.createElement("button")
    newButton.style.display = "flex"
    newButton.style.flexDirection = "column"
    newButton.style.padding = "10px"
    newButton.style.backgroundColor = "#506352"
    topContainer.appendChild(newButton)

    const newIcon = document.createElement("img")
    newIcon.src = Icons.PLUS
    newIcon.classList.add("icon")
    newIcon.style.width = "30px"
    newIcon.style.height = "30px"
    newButton.appendChild(newIcon)

    const newTitle = document.createElement("div")
    newTitle.innerText = "New Song"
    newButton.appendChild(newTitle)

    newButton.onclick = () => {
      this.app.windowManager.openWindow(new NewSongWindow(this.app))
    }

    const recentTitle = document.createElement("div")
    recentTitle.innerText = "Recently Opened"
    recentTitle.classList.add("title")
    bottomContainer.appendChild(recentTitle)

    const recentScroll = document.createElement("div")
    recentScroll.classList.add("recent-selector")
    bottomContainer.appendChild(recentScroll)
    RecentFileHandler.getRecents().forEach(entry => {
      const row = document.createElement("div")
      row.classList.add("recent-item")
      const name = document.createElement("div")
      name.classList.add("recent-name")
      name.innerText = entry.name
      const path = document.createElement("div")
      path.classList.add("recent-path")
      path.innerText = entry.path
      row.appendChild(name)
      row.appendChild(path)

      row.onclick = () => {
        recentScroll
          .querySelectorAll(".selected")
          .forEach(el => el.classList.remove("selected"))
        row.classList.add("selected")
      }

      row.ondblclick = () => {
        this.app.chartManager.loadSM(entry.path)
        this.closeWindow()
      }

      recentScroll.appendChild(row)
    })

    this.viewElement.appendChild(padding)
  }

  private handleKeyEvent(event: KeyboardEvent) {
    if (!this.windowElement.classList.contains("focused")) return
    const selected = this.viewElement.querySelector(".selected") as HTMLElement
    if (!selected) return
    if (event.code == "ArrowUp") {
      event.preventDefault()
      event.stopImmediatePropagation()
      const prev = selected.previousElementSibling
      if (prev) {
        selected
          .parentElement!.querySelectorAll(".selected")
          .forEach(el => el.classList.remove("selected"))
        prev.classList.add("selected")
        scrollIntoView(prev, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        })
      }
    }
    if (event.code == "ArrowDown") {
      event.preventDefault()
      event.stopImmediatePropagation()
      const next = selected.nextElementSibling
      if (next) {
        selected
          .parentElement!.querySelectorAll(".selected")
          .forEach(el => el.classList.remove("selected"))
        next.classList.add("selected")
        scrollIntoView(next, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        })
      }
    }
  }
}
