import { Color } from "pixi.js"
import tippy from "tippy.js"
import { App } from "../../App"
import {
  Theme,
  THEME_PROPERTY_DESCRIPTIONS,
  THEME_VAR_WHITELIST,
  ThemeProperty,
} from "../../data/ThemeData"
import { add, lighten } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Themes } from "../../util/Theme"
import { Window } from "./Window"

export class ThemeWindow extends Window {
  app: App

  private handlers: ((...args: any[]) => void)[] = []
  private generatorOptions: Partial<Theme> = {
    "text-color": new Color("white"),
    "bg-primary": new Color("#444"),
  }

  constructor(app: App) {
    super({
      title: "scufed teheme enditor",
      width: 500,
      height: 400,
      win_id: "theme_window",
    })
    this.app = app
    this.initView()
  }

  initView() {
    this.viewElement.replaceChildren()

    const padding = document.createElement("div")
    padding.classList.add("padding")

    const generatorGrid = document.createElement("div")
    generatorGrid.classList.add("theme-generator-grid")
    for (const p of ["bg-primary", "text-color"] as const) {
      generatorGrid.appendChild(this.createGenerator(p))
    }

    const colorGrid = document.createElement("div")
    colorGrid.classList.add("theme-color-grid")
    for (const p of THEME_VAR_WHITELIST) {
      colorGrid.appendChild(this.createPicker(p))
    }

    padding.appendChild(generatorGrid)
    padding.appendChild(colorGrid)
    this.viewElement.appendChild(padding)
  }

  createGenerator(id: ThemeProperty) {
    const updateValue = () => {
      const c = new Color(this.generatorOptions[id] ?? "black")
      colorLabel.innerText = c.toHex() + " | " + Math.round(c.alpha * 100) + "%"
      if (document.activeElement == colorInput) return
      colorInput.value = c.toHex()
      alphaInput.value = c.alpha.toString()
    }

    const setValue = () => {
      const newTheme = this.generatorOptions
      const color = new Color(colorInput.value)
      color.setAlpha(parseFloat(alphaInput.value))
      newTheme[id] = color
      this.generatePalette()
    }

    const container = document.createElement("div")
    container.classList.add("theme-color-cell")

    if (THEME_PROPERTY_DESCRIPTIONS[id] != "")
      tippy(container, {
        content: THEME_PROPERTY_DESCRIPTIONS[id],
      })

    const label = document.createElement("div")
    label.innerText = id

    const colorLabel = document.createElement("div")
    colorLabel.classList.add("theme-color-detail")

    const colorInput = document.createElement("input")
    colorInput.type = "color"
    colorInput.oninput = setValue
    colorInput.onblur = updateValue

    const alphaInput = document.createElement("input")
    alphaInput.type = "range"
    alphaInput.min = "0"
    alphaInput.max = "1"
    alphaInput.step = "0.001"
    alphaInput.oninput = setValue
    alphaInput.onblur = updateValue

    updateValue()

    container.replaceChildren(label, colorLabel, colorInput, alphaInput)

    return container
  }

  createPicker(id: ThemeProperty) {
    const updateValue = () => {
      const c = new Color(Themes.getCurrentTheme()[id])
      colorLabel.innerText = c.toHex() + " | " + Math.round(c.alpha * 100) + "%"
      if (document.activeElement == colorInput) return
      colorInput.value = c.toHex()
      alphaInput.value = c.alpha.toString()
    }

    const setValue = () => {
      const newTheme = Themes.getCurrentTheme()
      const color = new Color(colorInput.value)
      color.setAlpha(parseFloat(alphaInput.value))
      newTheme[id] = color
      Themes._applyTheme(newTheme)
    }

    const container = document.createElement("div")
    container.classList.add("theme-color-cell")

    if (THEME_PROPERTY_DESCRIPTIONS[id] != "")
      tippy(container, {
        content: THEME_PROPERTY_DESCRIPTIONS[id],
      })

    const label = document.createElement("div")
    label.innerText = id

    const colorLabel = document.createElement("div")
    colorLabel.classList.add("theme-color-detail")

    const colorInput = document.createElement("input")
    colorInput.type = "color"
    colorInput.oninput = setValue
    colorInput.onblur = updateValue

    const alphaInput = document.createElement("input")
    alphaInput.type = "range"
    alphaInput.min = "0"
    alphaInput.max = "1"
    alphaInput.step = "0.001"
    alphaInput.oninput = setValue
    alphaInput.onblur = updateValue

    updateValue()

    container.replaceChildren(label, colorLabel, colorInput, alphaInput)

    EventHandler.on("themeChanged", updateValue)
    this.handlers.push(updateValue)

    return container
  }

  average(c: Color) {
    return (c.red + c.green + c.blue) / 3
  }

  lighten(color: Color, gamma: number) {
    return new Color(lighten(new Color(color).toNumber(), 1 + gamma / 100))
  }

  add(color: Color, gamma: number) {
    return new Color(add(new Color(color).toNumber(), gamma))
  }

  generatePalette() {
    const modifiers = {
      border: (c: Color) => this.lighten(c, 10).setAlpha(0xbb),
      active: (c: Color) => this.lighten(c, 10),
      hover: (c: Color) => this.lighten(c, 30),
    }
    const theme: Partial<Theme> = { ...this.generatorOptions }

    theme["text-color"] ||=
      this.average(theme["bg-primary"]!) > 0.5
        ? new Color("#000")
        : new Color("#fff")
    theme["bg-input-border"] ||=
      this.average(theme["bg-primary"]!) > 0.5
        ? this.add(theme["bg-primary"]!, -30).setAlpha(0x77)
        : this.add(theme["bg-primary"]!, +30).setAlpha(0x77)
    theme["bg-tooltip"] ||= this.lighten(theme["bg-primary"]!, -10).setAlpha(
      0xee
    )
    theme["bg-secondary"] ||= this.lighten(theme["bg-primary"]!, -20)
    theme["bg-editor"] =
      theme["bg-editor"] ?? this.lighten(theme["bg-primary"]!, -60)
    theme["text-color-secondary"] = new Color(theme["text-color"]).setAlpha(
      0x77 / 0xff
    )
    theme["text-color-detail"] = new Color(theme["text-color"]).setAlpha(
      0x44 / 0xff
    )
    theme["text-color-disabled"] = new Color(theme["text-color"]).setAlpha(
      0x88 / 0xff
    )
    for (const type of ["primary", "secondary"] as const) {
      for (const [mod, func] of Object.entries(modifiers)) {
        theme[`bg-${type}-${mod as "border" | "active" | "hover"}`] = func(
          theme[`bg-${type}`]!
        )
      }
    }
    theme["bg-window"] = this.lighten(theme["bg-primary"]!, -10)
    theme["bg-window-inactive"] = this.lighten(theme["bg-primary"]!, -40)
    theme["bg-widget"] = this.add(theme["bg-primary"]!, -50).setAlpha(0x88)
    Themes._applyTheme(theme as Theme)
  }

  onClose(): void {
    this.handlers.forEach(h => EventHandler.off("themeChanged", h))
  }
}
