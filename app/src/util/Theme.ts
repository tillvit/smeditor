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

  private static validateTheme(theme: ThemeString): Theme {
    const newTheme = DEFAULT_THEMES["default"]
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
    return { ...this._userThemes, ...this._themes }
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
    this.currentTheme = theme
    EventHandler.emit("themeChanged")
  }

  static loadThemeFromColors(theme: ThemeString) {
    this._applyTheme(this.validateTheme(theme))
  }

  static getCurrentTheme() {
    return this.currentTheme
  }

  static exportCurrentTheme() {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(this.currentTheme).map(([prop, col]) => [
          prop,
          `^new Color('${col.toHexa()}')^`,
        ])
      )
    )
      .replaceAll(`"^`, "")
      .replaceAll(`^"`, "")
  }
}
