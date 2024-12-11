import { App } from "../../App"
import { KeyCombo, MODORDER, MODPROPS, Modifier } from "../../data/KeybindData"
import { Keybinds } from "../../util/Keybinds"
import { Window } from "./Window"

export class KeyComboWindow extends Window {
  app: App

  private readonly allowMods: boolean
  private readonly callback: (combo: KeyCombo) => void
  private combo: KeyCombo = { mods: [], key: "" }
  private readonly conflictCheck: (combo: KeyCombo) => string[] | "self"
  private listener?: (event: KeyboardEvent) => void

  static active = true

  constructor(
    app: App,
    allowMods: boolean,
    callback: (combo: KeyCombo) => void,
    conflictCheck?: (combo: KeyCombo) => string[] | "self"
  ) {
    super({
      title: "",
      width: 300,
      height: 168,
      disableClose: true,
      win_id: "keyComboSelector",
      blocking: true,
    })
    this.app = app
    this.allowMods = allowMods
    this.callback = callback
    this.conflictCheck = conflictCheck ?? (() => [])
    this.initView()

    KeyComboWindow.active = true
  }

  initView(): void {
    this.viewElement.replaceChildren()
    this.viewElement.classList.add("confirmation")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    padding.style.gap = "8px"

    const message = document.createElement("div")
    message.classList.add("label")
    message.innerText = "Input a key combo and select Ok when finished."

    padding.appendChild(message)

    const keyComboDisplay = document.createElement("input")
    keyComboDisplay.type = "text"
    keyComboDisplay.disabled = true
    keyComboDisplay.style.fontSize = "18px"
    keyComboDisplay.style.height = "24px"
    keyComboDisplay.style.flex = "0"
    keyComboDisplay.style.textAlign = "center"

    padding.appendChild(keyComboDisplay)

    const conflictDetail = document.createElement("div")
    conflictDetail.classList.add("detail")
    conflictDetail.innerText = "No conflicts"
    conflictDetail.style.flex = "1"

    padding.appendChild(conflictDetail)

    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const okButton = document.createElement("button")
    okButton.innerText = "Ok"
    okButton.onclick = () => {
      this.callback(this.combo)
      this.closeWindow()
    }
    okButton.classList.add("confirm")
    okButton.disabled = true

    const cancelButton = document.createElement("button")
    cancelButton.innerText = "Cancel"
    cancelButton.onclick = () => {
      this.closeWindow()
    }
    menu_options.append(cancelButton)
    menu_options.append(okButton)

    padding.appendChild(menu_options)
    this.viewElement.appendChild(padding)

    this.listener = event => {
      if (["Meta", "Control", "Shift", "Alt", "Escape"].includes(event.key))
        return
      this.combo.key = Keybinds.getKeyNameFromCode(event.code)
      if (this.allowMods) {
        const mods: Modifier[] = []
        for (let i = 0; i < MODPROPS.length; i++) {
          if (event[MODPROPS[i]]) mods.push(MODORDER[i])
        }
        this.combo.mods = mods
      }
      keyComboDisplay.value = Keybinds.getComboString(this.combo)

      const conflicts = this.conflictCheck(this.combo)
      if (conflicts == "self") {
        conflictDetail.innerText = "Combo already binded for this keybind"
        okButton.disabled = true
      } else {
        okButton.disabled = false
        if (conflicts.length >= 3) {
          conflictDetail.innerText = `Conflicts with ${conflicts.length} keybinds`
        } else if (conflicts.length >= 1) {
          conflictDetail.innerText = `Conflicts with ${conflicts.join(",")}`
        } else {
          conflictDetail.innerText = "No conflicts"
        }
      }

      event.preventDefault()
    }

    window.addEventListener("keydown", this.listener, true)
  }

  onClose(): void {
    window.removeEventListener("keydown", this.listener!, true)
    KeyComboWindow.active = false
  }
}
