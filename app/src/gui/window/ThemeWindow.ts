import { Color } from "pixi.js"
import tippy from "tippy.js"
import { App } from "../../App"
import {
  Theme,
  THEME_GENERATOR_LINKS,
  THEME_GROUPS,
  THEME_PROPERTY_DESCRIPTIONS,
  ThemeGroup,
  ThemeProperty,
} from "../../data/ThemeData"
import { add, lighten } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Themes } from "../../util/Theme"
import { Icons } from "../Icons"
import { Window } from "./Window"

export class ThemeWindow extends Window {
  app: App

  private handlers: ((...args: any[]) => void)[] = []
  private linkBlacklist = new Set<ThemeProperty>()

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

    const colorGrid = document.createElement("div")
    colorGrid.classList.add("theme-color-grid")

    THEME_GROUPS.forEach(g => {
      colorGrid.appendChild(this.createGroup(g))
    })

    padding.appendChild(colorGrid)

    this.viewElement.appendChild(padding)
  }

  createGroup(group: ThemeGroup) {
    const container = document.createElement("div")
    container.classList.add("theme-group")
    const title = document.createElement("div")
    title.classList.add("theme-group-label")
    title.innerText = group.name
    const pickerGrid = document.createElement("div")
    pickerGrid.classList.add("theme-picker-grid")
    group.ids.forEach(i => {
      pickerGrid.appendChild(this.createPicker(i))
    })
    container.replaceChildren(title, pickerGrid)
    return container
  }

  createPicker(opt: { id: ThemeProperty; label: string }) {
    const updateValue = () => {
      const c = new Color(Themes.getCurrentTheme()[opt.id])
      colorLabel.innerText = c.toHex() + " | " + Math.round(c.alpha * 100) + "%"
      if (document.activeElement == colorInput) return
      colorInput.value = c.toHex()
      alphaInput.value = c.alpha.toString()
    }

    const setValue = () => {
      const newTheme = Themes.getCurrentTheme()
      const color = new Color(colorInput.value)
      color.setAlpha(parseFloat(alphaInput.value))
      newTheme[opt.id] = color
      Themes._applyTheme(this.updateLinks(opt.id, newTheme))
    }

    const container = document.createElement("div")
    container.classList.add("theme-color-cell")

    if (THEME_PROPERTY_DESCRIPTIONS[opt.id] != "")
      tippy(container, {
        content: THEME_PROPERTY_DESCRIPTIONS[opt.id],
      })

    const label = document.createElement("div")
    label.innerText = opt.label

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

    container.replaceChildren(label, colorLabel, colorInput, alphaInput)

    if (this.hasLink(opt.id)) {
      const link = document.createElement("div")
      link.classList.add("ico-checkbox")
      const on = Icons.getIcon("LINK", 12)
      const off = Icons.getIcon("LINK_BROKEN", 12)

      let currentValue = true

      const update = () => {
        if (currentValue) {
          this.linkBlacklist.delete(opt.id)
        } else {
          this.linkBlacklist.add(opt.id)
        }
        on.style.display = currentValue ? "" : "none"
        off.style.display = currentValue ? "none" : ""
      }

      link.onclick = () => {
        currentValue = !currentValue
        update()
      }

      update()

      link.replaceChildren(on, off)

      container.appendChild(link)

      const newSetInput = () => {
        if (currentValue) {
          currentValue = false
          update()
        }
        setValue()
      }

      colorInput.oninput = newSetInput
      alphaInput.oninput = newSetInput
    }

    updateValue()

    EventHandler.on("themeChanged", updateValue)
    this.handlers.push(updateValue)

    return container
  }

  hasLink(id: ThemeProperty) {
    return Object.values(THEME_GENERATOR_LINKS)
      .flatMap(links => Object.keys(links))
      .includes(id)
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

  updateLinks(updatedId: ThemeProperty, theme: Theme) {
    const visited = new Set<string>()
    const queue: ThemeProperty[] = [updatedId]
    while (queue.length != 0) {
      const currentId = queue.shift()!
      const links = THEME_GENERATOR_LINKS[currentId]
      if (!links) continue
      for (const [id, transform] of Object.entries(links)) {
        if (this.linkBlacklist.has(id as ThemeProperty)) continue
        if (visited.has(id)) continue
        theme[id as ThemeProperty] = transform.bind(this)(theme[currentId])
        queue.push(id as ThemeProperty)
        visited.add(id)
      }
    }
    return theme
  }
}
