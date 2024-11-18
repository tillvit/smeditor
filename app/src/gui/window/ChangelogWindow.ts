import markdownit from "markdown-it"
import { App } from "../../App"
import { Window } from "./Window"

interface ChangelogOptions {
  version: string
  markdown: string
}

export class ChangelogWindow extends Window {
  app: App
  opt: ChangelogOptions

  constructor(app: App, options: ChangelogOptions) {
    super({
      title: "Changelog",
      width: 600,
      height: 500,
      win_id: "changelog",
    })
    this.app = app
    this.opt = options
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const mdContainer = document.createElement("div")
    mdContainer.classList.add("markdown-container")

    const result = markdownit().render(
      `# ${this.opt.version}\n---\n` + this.opt.markdown
    )

    mdContainer.innerHTML = result

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
