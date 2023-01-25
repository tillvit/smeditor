import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { GAMEPLAY_KEYBINDS } from "../data/GameplayKeybindData"
import { KEYBINDS, Modifier, SPECIAL_KEYS } from "../data/KeybindData"

const MODPROPS: ["ctrlKey", "altKey", "shiftKey", "metaKey"] = [
  "ctrlKey",
  "altKey",
  "shiftKey",
  "metaKey",
]
const MODORDER = [Modifier.CTRL, Modifier.ALT, Modifier.SHIFT, Modifier.META]

export class Keybinds {
  private app

  constructor(app: App) {
    this.app = app

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLInputElement) return
      if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return

      const mods: Modifier[] = []
      for (let i = 0; i < MODPROPS.length; i++) {
        if (e[MODPROPS[i]]) mods.push(MODORDER[i])
      }
      const key = Keybinds.getKeyNameFromCode(e.code)

      if (
        app.chartManager.getMode() == EditMode.Play &&
        app.chartManager.chart?.gameType
      ) {
        const kbds =
          GAMEPLAY_KEYBINDS[app.chartManager.chart?.gameType.id] ?? []
        const gp_matches = Object.values(kbds).filter(value => {
          for (const keybind of value.keybinds) {
            if (this.compareModifiers(keybind.mods, mods) && keybind.key == key)
              return true
          }
          return false
        })
        if (gp_matches.length > 0) {
          e.preventDefault()
          if (app.windowManager.isBlocked()) return
          for (const match of gp_matches) {
            if (e.repeat) continue
            app.chartManager.judgeCol(match.col)
            return
          }
        }
      }

      const matches = Object.values(KEYBINDS).filter(value => {
        for (const keybind of value.keybinds) {
          if (this.compareModifiers(keybind.mods, mods) && keybind.key == key)
            return true
        }
        return false
      })
      if (matches.length > 0) {
        e.preventDefault()
        if (app.windowManager.isBlocked()) return
        for (const match of matches) {
          let disabled = match.disabled
          if (disabled instanceof Function) disabled = disabled(this.app)
          if (disabled) continue
          if (match.disableRepeat && e.repeat) continue
          match.callback(this.app)
          return
        }
      }
    })

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLInputElement) return
      if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return

      const mods: Modifier[] = []
      for (let i = 0; i < MODPROPS.length; i++) {
        if (e[MODPROPS[i]]) mods.push(MODORDER[i])
      }
      const key = Keybinds.getKeyNameFromCode(e.code)

      if (
        app.chartManager.getMode() == EditMode.Play &&
        app.chartManager.chart?.gameType
      ) {
        const kbds =
          GAMEPLAY_KEYBINDS[app.chartManager.chart?.gameType.id] ?? []
        const gp_matches = Object.values(kbds).filter(value => {
          for (const keybind of value.keybinds) {
            if (this.compareModifiers(keybind.mods, mods) && keybind.key == key)
              return true
          }
          return false
        })
        if (gp_matches.length > 0) {
          e.preventDefault()
          if (app.windowManager.isBlocked()) return
          for (const match of gp_matches) {
            if (e.repeat) continue
            app.chartManager.judgeColUp(match.col)
            return
          }
        }
      }

      const matches = Object.values(KEYBINDS).filter(value => {
        for (const keybind of value.keybinds) {
          if (this.compareModifiers(keybind.mods, mods) && keybind.key == key)
            return true
        }
        return false
      })
      if (matches.length > 0) {
        e.preventDefault()
        for (const match of matches) {
          let disabled = match.disabled
          if (disabled instanceof Function) disabled = disabled(this.app)
          if (disabled) continue
          if (match.disableRepeat && e.repeat) continue
          match.callbackKeyUp?.(this.app)
          return
        }
      }
    })
  }

  static getKeyNameFromCode(code: string): string {
    let key = code
    if (key.startsWith("Digit")) key = key.slice(5)
    if (key.startsWith("Key")) key = key.slice(3)
    if (key in SPECIAL_KEYS) key = SPECIAL_KEYS[key]
    return key
  }

  static getKeybindString(id: string): string {
    if (!(id in KEYBINDS)) {
      console.log("Couldn't find keybind with id " + id)
      return ""
    }
    const item = KEYBINDS[id]
    return item.keybinds
      .map(keybind => {
        const mods = MODORDER.filter(x => keybind.mods.includes(x)).join("+")
        return mods + (mods != "" ? "+" : "") + keybind.key
      })
      .join(" / ")
  }

  private compareModifiers(mod1: Modifier[], mod2: Modifier[]) {
    if (mod1.length != mod2.length) return false
    for (const mod of MODORDER) {
      if ((mod1.includes(mod) ? 1 : 0) + (mod2.includes(mod) ? 1 : 0) == 1)
        return false
    }
    return true
  }
}
