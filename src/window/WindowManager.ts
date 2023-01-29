import { App } from "../App"
import { Window } from "./Window"

export class WindowManager {
  view: HTMLDivElement
  windows: Window[] = []
  app: App

  constructor(app: App, view: HTMLDivElement) {
    this.app = app
    this.view = view
  }

  unfocusAll() {
    for (const window of this.view.querySelectorAll(".focused")) {
      window.classList.remove("focused")
    }
  }

  isBlocked(): boolean {
    return !this.windows.every(window => !window.options.blocking)
  }

  openWindow(window: Window) {
    if (window.options.win_id) {
      const existingWindow = this.getWindowById(window.options.win_id)
      if (existingWindow) {
        existingWindow.focus()
        return
      }
    }
    window.addToManager(this)
    this.windows.push(window)
  }

  removeWindow(window: Window) {
    this.windows.splice(this.windows.indexOf(window), 1)
  }

  getWindowById(id: string): Window | undefined {
    for (const window of this.windows) {
      if (window.options.win_id == id) return window
    }
    return undefined
  }
}
