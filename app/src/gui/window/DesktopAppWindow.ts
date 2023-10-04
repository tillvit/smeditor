import { App } from "../../App"

import { Icons } from "../Icons"
import { InitialWindow } from "./InitialWindow"
import { Window } from "./Window"

export class DesktopAppWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "",
      width: 400,
      height: 320,
      disableClose: true,
      win_id: "desktop_app",
    })
    this.app = app
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const logo = document.createElement("div")
    logo.classList.add("logo")
    logo.innerText = "SMEditor"

    padding.appendChild(logo)

    const downloadButton = document.createElement("button")
    downloadButton.style.padding = "10px"
    downloadButton.style.backgroundColor = "#414352"

    const downloadTopContainer = document.createElement("div")
    downloadTopContainer.style.display = "flex"
    downloadTopContainer.style.flexDirection = "row"

    const downloadIcon = document.createElement("img")
    downloadIcon.src = Icons.DOWNLOAD
    downloadIcon.classList.add("icon")
    downloadIcon.style.width = "30px"
    downloadIcon.style.height = "30px"
    downloadTopContainer.appendChild(downloadIcon)

    const downloadTitle = document.createElement("div")
    downloadTitle.innerText = "Download the desktop app"
    downloadTopContainer.appendChild(downloadTitle)

    const downloadVersion = document.createElement("div")
    downloadVersion.innerText = "v1.0.0"
    downloadVersion.classList.add("desktop-version")

    downloadButton.appendChild(downloadTopContainer)
    downloadButton.appendChild(downloadVersion)

    padding.appendChild(downloadButton)

    const continueButton = document.createElement("button")
    continueButton.style.display = "flex"
    continueButton.style.flexDirection = "row"
    continueButton.style.padding = "10px"
    continueButton.style.backgroundColor = "#414352"

    const continueIcon = document.createElement("img")
    continueIcon.src = Icons.WEB
    continueIcon.classList.add("icon")
    continueIcon.style.width = "30px"
    continueIcon.style.height = "30px"
    continueButton.appendChild(continueIcon)

    const continueTitle = document.createElement("div")
    continueTitle.innerText = "Continue in web browser"
    continueButton.appendChild(continueTitle)

    continueButton.onclick = () => {
      this.closeWindow()
      this.app.windowManager.openWindow(new InitialWindow(this.app))
    }

    padding.appendChild(continueButton)

    this.viewElement.appendChild(padding)
  }
}
