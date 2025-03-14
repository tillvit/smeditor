import { App } from "../../App"
import { Window } from "./Window"

export class AboutWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "About",
      width: 300,
      height: 170,
      win_id: "about",
    })
    this.app = app
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    const padding = document.createElement("div")
    padding.classList.add("padding")
    const container = document.createElement("div")
    container.classList.add("about-container")
    const logoContainer = document.createElement("div")
    logoContainer.classList.add("logo-container")
    const logo = document.createElement("img")
    logo.src = "/smeditor/assets/icon/logo.png"
    const logoText = document.createElement("div")
    logoText.innerText = "SMEditor"
    const description = document.createElement("div")
    description.style.textAlign = "center"
    description.innerText = `Open source online web tool to view and edit StepMania charts (.sm/.ssc files). Maintained by tillvit`

    const versionText = document.createElement("div")
    versionText.style.fontSize = "14px"
    versionText.style.color = "var(--text-color-secondary)"
    versionText.innerText = `Core v${window.app.VERSION}` // why does using App break pixi
    if (window.nw) {
      const gui = nw.require("nw.gui")
      versionText.innerText += ` | App v${gui.App.manifest.version}`
    }
    container.appendChild(logoContainer)
    logoContainer.appendChild(logo)
    logoContainer.appendChild(logoText)
    container.appendChild(description)
    container.appendChild(versionText)
    padding.appendChild(container)
    this.viewElement.appendChild(padding)
  }
}
