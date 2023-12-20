import { Flags } from "../../util/Flags"
import { capitalize } from "../../util/Util"

interface WaterfallMessage {
  type: "log" | "warn" | "error" | ""
  container: HTMLDivElement
  timeoutID: NodeJS.Timeout
  clearTimeoutID: NodeJS.Timeout
  count: number
}

export class WaterfallManager {
  private static _view: HTMLDivElement
  private static messages: Record<string, WaterfallMessage> = {}

  private static get view(): HTMLDivElement {
    if (!this._view) {
      this._view = document.getElementById("waterfall") as HTMLDivElement
      if (!Flags.menuBar) {
        this._view.style.top = "10px"
      }
    }
    return this._view
  }

  static create(message: string) {
    if (this.view == null) return
    let count = 1
    if (this.messages[message] && this.messages[message].type == "") {
      const existingMessage = this.messages[message]
      clearTimeout(existingMessage.timeoutID)
      clearTimeout(existingMessage.clearTimeoutID)
      count = ++existingMessage.count
      this.view.removeChild(existingMessage.container)
    }
    const container = document.createElement("div")
    container.innerHTML = message
    if (count > 1) container.innerHTML += ` (${count})`
    container.classList.add("waterfall-item")
    WaterfallManager.messages[message] = {
      type: "",
      container,
      timeoutID: setTimeout(() => {
        container.classList.add("waterfall-exiting")
      }, 5000),
      clearTimeoutID: setTimeout(() => {
        delete this.messages[message]
        this.view.removeChild(container)
      }, 5500),
      count,
    }
    this.view.appendChild(container)
  }

  static createFormatted(message: string, type: "log" | "warn" | "error") {
    if (this.view == null) return
    let count = 1
    if (this.messages[message] && this.messages[message].type == type) {
      const existingMessage = this.messages[message]
      clearTimeout(existingMessage.timeoutID)
      clearTimeout(existingMessage.clearTimeoutID)
      count = ++existingMessage.count
      this.view.removeChild(existingMessage.container)
    }
    const container = document.createElement("div")
    container.innerHTML =
      `<div class='waterfall-${type}'>${capitalize(type)}: </div>` + message
    if (count > 1) container.innerHTML += ` (${count})`
    container.classList.add("waterfall-item")
    console[type](message)
    WaterfallManager.messages[message] = {
      type,
      container,
      timeoutID: setTimeout(() => {
        container.classList.add("waterfall-exiting")
      }, 5000),
      clearTimeoutID: setTimeout(() => {
        delete this.messages[message]
        this.view.removeChild(container)
      }, 5500),
      count,
    }
    this.view.appendChild(container)
  }
}
