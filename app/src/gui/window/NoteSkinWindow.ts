import { App } from "../../App"
import { Window } from "./Window"

export class NoteskinWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "Noteskin Selection",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "noteskin-selection",
      blocking: false,
    })
    this.app = app

    this.initView()
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    this.viewElement.appendChild(padding)
  }
}
