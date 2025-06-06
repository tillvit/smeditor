import tippy from "tippy.js"
import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { GameTypeRegistry } from "../chart/gameTypes/GameTypeRegistry"
import { GAMEPLAY_KEYBINDS } from "../data/GameplayKeybindData"
import {
  KEY_DISPLAY_OVERRIDES,
  KEYBIND_DATA,
  KeyCombo,
  Modifier,
  MODIFIER_ASCII,
  MODORDER,
  MODPROPS,
  SPECIAL_KEYS,
} from "../data/KeybindData"

export class Keybinds {
  private static app: App
  private static userKeybinds: Map<string, KeyCombo[]> = new Map()
  private static userGameplayKeybinds: Map<string, (string[] | null)[]> =
    new Map()
  private static enabled = true

  static load(app: App) {
    this.app = app
    try {
      this.loadKeybinds()
    } catch (e: any) {
      console.error("Failed to load user keybinds!")
      console.error(e.stack)
      this.userKeybinds.clear()
      this.userGameplayKeybinds.clear()
    }

    window.addEventListener("keydown", (e: KeyboardEvent) =>
      this.checkKey(e, "keydown")
    )

    window.addEventListener("keyup", (e: KeyboardEvent) =>
      this.checkKey(e, "keyup")
    )
  }

  static checkKey(event: KeyboardEvent, type: "keydown" | "keyup") {
    if (!this.enabled) return
    if ((<HTMLElement>event.target).classList.contains("inlineEdit")) return
    if (event.target instanceof HTMLTextAreaElement) return
    if (event.target instanceof HTMLInputElement) return
    if (event.target instanceof HTMLButtonElement) return
    if (["Meta", "Control", "Shift", "Alt"].includes(event.key)) return

    const mods: Modifier[] = []
    for (let i = 0; i < MODPROPS.length; i++) {
      if (event[MODPROPS[i]]) mods.push(MODORDER[i])
    }
    const key = Keybinds.getKeyNameFromEvent(event)

    // Check for gameplay keybinds
    if (
      (this.app.chartManager.getMode() == EditMode.Play ||
        this.app.chartManager.getMode() == EditMode.Record) &&
      this.app.chartManager.loadedChart?.gameType &&
      !event.repeat
    ) {
      const kbds =
        GAMEPLAY_KEYBINDS[this.app.chartManager.loadedChart?.gameType.id] ?? []
      const userKbds =
        this.userGameplayKeybinds.get(
          this.app.chartManager.loadedChart?.gameType.id
        ) ?? []
      const matchedColumn = Object.values(kbds).findIndex((kbd, col) =>
        (userKbds[col] ?? kbd.keys).some(k => key == k)
      )
      if (matchedColumn != -1) {
        event.preventDefault()
        if (
          this.app.windowManager.getFocusedWindow()?.options?.win_id ==
          "keybind_options"
        )
          return
        if (this.app.windowManager.isBlocked()) return
        this.app.chartManager[type == "keydown" ? "judgeCol" : "judgeColUp"](
          matchedColumn
        )
        return
      }
    }

    // Check for normal keybinds

    const matches = Object.keys(KEYBIND_DATA)
      .filter(id => !["cut", "copy", "paste", "pasteReplace"].includes(id)) // prevent keybinds from using these
      .filter(id => {
        for (const combo of this.getCombosForKeybind(id)) {
          if (this.compareModifiers(combo.mods, mods) && combo.key == key)
            return true
        }
        return false
      })
      .map(key => KEYBIND_DATA[key])
    if (matches.length > 0) {
      if (matches.every(match => match.preventDefault != false))
        event.preventDefault()
      if (
        this.app.windowManager.getFocusedWindow()?.options?.win_id ==
        "keybind_options"
      )
        return
      if (this.app.windowManager.isBlocked()) return
      for (const match of matches) {
        let disabled = match.disabled
        if (disabled instanceof Function) disabled = disabled(this.app)
        if (disabled) continue
        if (match.disableRepeat && event.repeat) continue

        if (type == "keydown") match.callback(this.app)
        else match.callbackKeyUp?.(this.app)
        return
      }
    }
  }

  static getKeyNameFromEvent(event: KeyboardEvent): string {
    if (event.which >= 65 && event.which <= 90) {
      // handle letters separately for azerty keyboards
      return String.fromCharCode(event.which).toUpperCase()
    }
    let key = event.code
    if (key.startsWith("Digit")) key = key.slice(5)
    if (key.startsWith("Key")) key = key.slice(3)
    if (key in SPECIAL_KEYS) key = SPECIAL_KEYS[key]
    return key
  }

  static getKeybindString(id: string): string {
    return this.getCombosForKeybind(id)
      .map(combo => this.getComboString(combo))
      .join(" / ")
  }

  static getComboString(combo: KeyCombo) {
    const modString = MODORDER.filter(x => combo.mods.includes(x))
      .map(mod => MODIFIER_ASCII[mod])
      .join("")
    return (
      modString +
      (modString != "" ? " " : "") +
      (KEY_DISPLAY_OVERRIDES[combo.key] ?? combo.key)
    )
  }

  static getCombosForKeybind(id: string) {
    if (!(id in KEYBIND_DATA)) {
      console.log("Couldn't find keybind with id " + id)
      return []
    }
    return this.userKeybinds.get(id) ?? KEYBIND_DATA[id].combos
  }

  static getKeysForGameType(id: string) {
    const gameType = GameTypeRegistry.getGameType(id)
    if (!gameType) {
      console.log("Couldn't find game type with id " + id)
      return []
    }
    return new Array(gameType.numCols)
      .fill(null)
      .map(
        (_, col) =>
          this.userGameplayKeybinds.get(id)?.[col] ??
          GAMEPLAY_KEYBINDS[id]?.[col].keys ??
          []
      )
  }

  static compareModifiers(mod1: Modifier[], mod2: Modifier[]) {
    if (mod1.length != mod2.length) return false
    for (const mod of MODORDER) {
      if ((mod1.includes(mod) ? 1 : 0) + (mod2.includes(mod) ? 1 : 0) == 1)
        return false
    }
    return true
  }

  static compareCombos(combo1: KeyCombo, combo2: KeyCombo) {
    return (
      combo1.key == combo2.key &&
      this.compareModifiers(combo1.mods, combo2.mods)
    )
  }

  static loadKeybinds() {
    const userKbd = localStorage.getItem("keybinds")
    if (userKbd) {
      const items = JSON.parse(userKbd) as {
        [key: string]: KeyCombo[]
      }
      if (typeof items != "object")
        return console.error("Couldn't load keybinds from storage")
      for (const [key, value] of Object.entries(items)) {
        if (!(key in KEYBIND_DATA)) {
          console.warn("Couldn't load keybind " + key + ": key doesn't exist")
          continue
        }
        if (!Array.isArray(value)) {
          console.warn(
            "Couldn't load keybind " + key + ": value is not an array"
          )
        }
        this.userKeybinds.set(
          key,
          value.filter(combo => {
            if (typeof combo.key != "string" || !Array.isArray(combo.mods)) {
              console.warn(
                "Couldn't load keycombo for keybind " +
                  key +
                  ": " +
                  JSON.stringify(combo)
              )
              return false
            }
            return true
          })
        )
      }
    }

    const userGPKbd = localStorage.getItem("keybindsGP")
    if (userGPKbd) {
      const items = JSON.parse(userGPKbd) as {
        [key: string]: (string[] | null)[]
      }
      if (typeof items != "object")
        return console.error("Couldn't load gameplay keybinds from storage")
      for (const [key, value] of Object.entries(items)) {
        if (!GameTypeRegistry.getGameType(key)) {
          console.warn(
            "Couldn't load gameplay keybinds for gameType " +
              key +
              ": gameType doesn't exist"
          )
          continue
        }
        if (!Array.isArray(value)) {
          console.warn(
            "Couldn't load gameplay keybind " + key + ": value is not an array"
          )
        }
        this.userGameplayKeybinds.set(
          key,
          value.map((keys, col) => {
            if (!Array.isArray(keys) && keys !== null) {
              console.warn(
                "Couldn't load gameplay keys for type " +
                  key +
                  " col " +
                  col +
                  ": " +
                  JSON.stringify(keys)
              )
              return null
            }
            return keys
          })
        )
      }
    }
  }
  static clearSave() {
    localStorage.removeItem("keybinds")
    localStorage.removeItem("keybindsGP")
  }

  static setKeybind(id: string, combo: KeyCombo) {
    if (!this.userKeybinds.has(id))
      this.userKeybinds.set(id, [...KEYBIND_DATA[id].combos])

    this.userKeybinds.get(id)?.push(combo)
    this.checkIsDefault(id)
    this.saveKeybinds()
  }

  static removeKeybind(id: string, combo: KeyCombo) {
    if (!this.userKeybinds.has(id))
      this.userKeybinds.set(id, [...KEYBIND_DATA[id].combos])
    this.userKeybinds.set(
      id,
      this.userKeybinds.get(id)!.filter(c => !this.compareCombos(c, combo))
    )
    this.checkIsDefault(id)
    this.saveKeybinds()
  }

  static revertKeybind(id: string) {
    this.userKeybinds.delete(id)
    this.saveKeybinds()
  }

  static revertGameplayKeybind(id: string, col: number) {
    if (this.userGameplayKeybinds.has(id)) {
      this.userGameplayKeybinds.get(id)![col] = null
      if (this.userGameplayKeybinds.get(id)!.every(a => a === null)) {
        this.userGameplayKeybinds.delete(id)
      }
    }
    this.saveKeybinds()
  }

  static setGameplayKeybind(id: string, col: number, key: string) {
    if (!this.userGameplayKeybinds.has(id))
      this.userGameplayKeybinds.set(
        id,
        new Array(GameTypeRegistry.getGameType(id)!.numCols).fill(null)
      )
    if (this.userGameplayKeybinds.get(id)![col] == null) {
      this.userGameplayKeybinds.get(id)![col] = [
        ...(GAMEPLAY_KEYBINDS[id]?.[col].keys ?? []),
      ]
    }
    this.userGameplayKeybinds.get(id)![col]!.push(key)
    this.checkIsDefaultGameplay(id, col)
    this.saveKeybinds()
  }

  static removeGameplayKeybind(id: string, col: number, key: string) {
    if (!this.userGameplayKeybinds.has(id))
      this.userGameplayKeybinds.set(
        id,
        new Array(GameTypeRegistry.getGameType(id)!.numCols).fill(null)
      )
    if (this.userGameplayKeybinds.get(id)![col] == null) {
      this.userGameplayKeybinds.get(id)![col] = [
        ...(GAMEPLAY_KEYBINDS[id]?.[col].keys ?? []),
      ]
    }
    this.userGameplayKeybinds.get(id)![col] = this.userGameplayKeybinds
      .get(id)!
      [col]!.filter(k => k != key)
    this.checkIsDefaultGameplay(id, col)
    this.saveKeybinds()
  }

  static checkIsDefault(id: string) {
    if (!this.userKeybinds.has(id)) return true
    const userCombos = this.userKeybinds.get(id)!
    const defaultCombos = [...KEYBIND_DATA[id].combos]

    if (userCombos.length != defaultCombos.length) return false
    // weird way to compare
    if (
      userCombos
        .map(combo => this.getComboString(combo))
        .sort()
        .join("∆") ==
      defaultCombos
        .map(combo => this.getComboString(combo))
        .sort()
        .join("∆")
    ) {
      this.userKeybinds.delete(id)
      return true
    }
    return false
  }

  static checkIsDefaultGameplay(id: string, col: number) {
    if (
      !this.userGameplayKeybinds.has(id) ||
      this.userGameplayKeybinds.get(id)![col] === null
    )
      return true
    const userKeys = this.userGameplayKeybinds.get(id)![col]!
    const defaultKeys = [...(GAMEPLAY_KEYBINDS[id]?.[col].keys ?? [])]

    if (userKeys.length != defaultKeys.length) return false
    // weird way to compare
    if (userKeys.sort().join("∆") == defaultKeys.sort().join("∆")) {
      this.userGameplayKeybinds.get(id)![col] = null
      if (this.userGameplayKeybinds.get(id)!.every(a => a === null)) {
        this.userGameplayKeybinds.delete(id)
      }
      return true
    }
    return false
  }

  static saveKeybinds() {
    const keybindObj: Record<string, KeyCombo[]> = {}
    for (const [key, combos] of this.userKeybinds.entries()) {
      keybindObj[key] = combos
    }
    localStorage.setItem("keybinds", JSON.stringify(keybindObj))

    const gameplayKeybindObj: Record<string, (string[] | null)[]> = {}
    for (const [key, combos] of this.userGameplayKeybinds.entries()) {
      gameplayKeybindObj[key] = combos
    }
    localStorage.setItem("keybindsGP", JSON.stringify(gameplayKeybindObj))
  }

  private static getKeybindTooltip(id: string) {
    const combos = this.getCombosForKeybind(id)
    return combos
      .map(combo => {
        let kbd = this.getComboString(combo)
        if (kbd == "") return ""
        kbd = kbd
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;")

        return "<button class='pref-keybind-combo'>" + kbd + "</button>"
      })
      .join("")
  }

  private static evaluateTaggedTooltip(
    strings: TemplateStringsArray,
    ids: string[]
  ) {
    ids = ids.map(id => {
      if (id.startsWith("\\")) return id.slice(1)
      return this.getKeybindTooltip(id)
    })

    // Join both arrays together
    const output = []
    for (let i = 0; i < ids.length; i++) {
      output.push(strings[i])
      output.push(ids[i])
    }
    output.push(strings[ids.length + 1])

    return (
      `<div style='display: flex; align-items: center; gap: 0.375rem'>` +
      output.join("") +
      "</div>"
    )
  }

  static createKeybindTooltip(element: Element) {
    return (strings: TemplateStringsArray, ...ids: string[]) => {
      tippy(element, {
        allowHTML: true,
        onShow: inst => {
          inst.setContent(this.evaluateTaggedTooltip(strings, ids))
        },
      })
    }
  }

  static disableKeybinds() {
    this.enabled = false
  }

  static enableKeybinds() {
    this.enabled = true
  }
}
