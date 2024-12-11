import markdownit from "markdown-it"
import { App } from "../../App"
import { Window } from "./Window"

export interface CoreVersion {
  version: string
  date: number
  changelog: string
}

export class ChangelogWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "Changelog",
      width: 600,
      height: 500,
      win_id: "changelog",
    })
    this.app = app
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const mdContainer = document.createElement("div")
    mdContainer.classList.add("markdown-container")

    fetch("/smeditor/assets/app/changelog.json")
      .then(data => data.json())
      .then((versions: CoreVersion[]) => {
        mdContainer.innerHTML = versions
          .map(version => {
            return `# ${version.version}\n---\n` + version.changelog
          })
          .map(text => `<div>${markdownit().render(text)}</div>`)
          .join("")
      })

    padding.appendChild(mdContainer)

    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")
    menu_options.style.justifyContent = "flex-end"

    const okButton = document.createElement("button")
    okButton.innerText = "Close"
    okButton.onclick = () => {
      this.closeWindow()
    }
    okButton.classList.add("confirm")
    menu_options.append(okButton)

    padding.appendChild(menu_options)
    this.viewElement.appendChild(padding)
  }
}
