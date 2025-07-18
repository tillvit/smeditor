import { App } from "../../App"
import { Window } from "./Window"

interface ConfirmationOption {
  label: string
  callback?: () => void
  type: "delete" | "confirm" | "default"
}

export class ConfirmationWindow extends Window {
  app: App

  private buttonOptions: ConfirmationOption[]
  private readonly message: string
  private readonly detail?: string
  private resolve?: (value: string) => void
  resolved: Promise<string> = new Promise(resolve => (this.resolve = resolve))

  constructor(
    app: App,
    title: string,
    message: string,
    buttonOptions: ConfirmationOption[],
    detail?: string
  ) {
    super({
      title: title,
      width: 300,
      disableClose: true,
      win_id: "confirm",
      blocking: true,
    })
    this.app = app
    this.message = message
    this.detail = detail
    this.buttonOptions = buttonOptions
    this.initView()
  }

  initView(): void {
    this.viewElement.replaceChildren()
    this.viewElement.classList.add("confirmation")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    padding.style.gap = "0.3rem"

    const message = document.createElement("div")
    message.classList.add("label")
    message.innerText = this.message

    padding.appendChild(message)

    if (this.detail) {
      const detail = document.createElement("div")
      detail.classList.add("secondary")
      detail.innerText = this.detail
      padding.appendChild(detail)
    }

    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    this.buttonOptions.forEach(option => {
      const button = document.createElement("button")
      button.innerText = option.label
      button.onclick = () => {
        option.callback?.()
        this.resolve?.(option.label)
        this.closeWindow()
      }
      if (option.type != "default") button.classList.add(option.type)
      menu_options.append(button)
    })
    padding.appendChild(menu_options)
    this.viewElement.appendChild(padding)

    requestAnimationFrame(() => this.center())
  }
}
