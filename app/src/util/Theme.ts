import { Color } from "pixi.js"
import {
  DEFAULT_THEMES,
  Theme,
  THEME_VAR_WHITELIST,
  ThemeString,
} from "../data/ThemeData"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { EventHandler } from "./EventHandler"
import { Options } from "./Options"

export class Themes {
  private static _themes = DEFAULT_THEMES
  private static _userThemes: Record<string, Theme> = {}
  private static _initialized = false
  private static style: HTMLStyleElement
  private static currentTheme: Theme

  private static initialize() {
    this._createThemeStyle()
    this._loadUserThemes()
    this._initialized = true
  }

  private static _createThemeStyle() {
    const style = document.createElement("style")
    document.getElementsByTagName("head")[0].appendChild(style)
    this.style = style
  }
  private static _loadUserThemes() {
    let userThemes: Record<string, ThemeString> = {}
    try {
      userThemes = JSON.parse(localStorage.getItem("themes") ?? "{}")
    } catch (_) {
      console.warn("Error loading user themes")
    }
    const loadedThemes: Record<string, Theme> = {}
    for (const [id, theme] of Object.entries(userThemes)) {
      loadedThemes[id] = this.validateTheme(theme)
    }
    this._userThemes = loadedThemes
  }

  private static _saveUserThemes() {
    // Convert colors back into strings
    const themeStrings = Object.fromEntries(
      Object.entries(this._userThemes).map(([id, theme]) => [
        id,
        this.convertThemeToString(theme),
      ])
    )
    localStorage.setItem("themes", JSON.stringify(themeStrings))
  }

  private static validateTheme(theme: ThemeString): Theme {
    const newTheme = { ...DEFAULT_THEMES["default"] }
    if (typeof theme !== "object") return newTheme
    for (const prop of THEME_VAR_WHITELIST) {
      if (theme[prop] === undefined) continue
      try {
        newTheme[prop] = new Color(theme[prop])
      } catch (e) {
        // Invalid color
        console.warn(`Invalid color ${theme[prop]} for ${prop}`)
      }
    }
    return newTheme
  }

  static getThemes() {
    return { ...this._themes, ...this._userThemes }
  }

  static getBuiltinThemes() {
    return this._themes
  }

  static getUserThemes() {
    return this._userThemes
  }

  static loadTheme(id: string) {
    if (!this._initialized) {
      this.initialize()
    }
    let theme = this.getThemes()[id]
    if (!theme) {
      WaterfallManager.createFormatted(
        "Error loading theme: Invalid theme id",
        "error"
      )
      theme = DEFAULT_THEMES["default"]
    }
    Options.general.theme = id
    this._applyTheme(theme)
  }

  static _applyTheme(theme: Theme) {
    const styleText = `body{${THEME_VAR_WHITELIST.map(
      key =>
        `--${key}: ${(theme[key] ?? DEFAULT_THEMES["default"][key]).toHexa()};`
    ).join("")}}`
    this.style.innerHTML = styleText
    this.currentTheme = { ...theme }
    EventHandler.emit("themeChanged")
  }

  static loadThemeFromColors(theme: ThemeString) {
    this._applyTheme(this.validateTheme(theme))
  }

  static getCurrentTheme() {
    return this.currentTheme
  }

  private static convertThemeToString(theme: Theme) {
    return Object.fromEntries(
      Object.entries(theme).map(([prop, col]) => [prop, col.toHexa()])
    ) as ThemeString
  }

  static exportCurrentTheme(options?: { code?: boolean; spaces?: boolean }) {
    options = {
      code: false,
      spaces: false,
      ...options,
    }
    if (options.code) {
      return JSON.stringify(
        Object.fromEntries(
          Object.entries(this.currentTheme).map(([prop, col]) => [
            prop,
            `^new Color('${col.toHexa()}')^`,
          ])
        ),
        null,
        options.spaces ? 2 : 0
      )
        .replaceAll(`"^`, "")
        .replaceAll(`^"`, "")
    }
    return JSON.stringify(
      this.convertThemeToString(this.currentTheme),
      null,
      options.spaces ? 2 : 0
    )
  }

  static createUserTheme(id: string, base?: Theme) {
    if (this.getThemes()[id] !== undefined) return
    if (base) {
      this._userThemes[id] = { ...base }
    } else {
      this._userThemes[id] = { ...DEFAULT_THEMES["default"] }
    }
    this._saveUserThemes()
  }

  static setUserTheme(id: string, base: Theme) {
    if (this._userThemes[id] === undefined) return
    this._userThemes[id] = { ...base }
    this._saveUserThemes()
  }

  static deleteUserTheme(id: string) {
    if (this._userThemes[id] === undefined) return
    delete this._userThemes[id]
    this.loadTheme("default")
    this._saveUserThemes()
  }

  static renameUserTheme(id: string, newId: string) {
    if (this._userThemes[id] === undefined) return
    if (this.getThemes()[newId] !== undefined) return
    this._userThemes[newId] = this._userThemes[id]
    delete this._userThemes[id]
    this._saveUserThemes()
  }

  static parseThemeText(text: string) {
    let theme
    try {
      theme = JSON.parse(text)
    } catch (_) {
      return null
    }
    return this.validateTheme(theme)
  }
}
