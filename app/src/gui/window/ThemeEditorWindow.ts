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
import { Options } from "../../util/Options"
import { Themes } from "../../util/Theme"
import { ColorPicker } from "../element/ColorPicker"
import { Icons } from "../Icons"
import { ThemeSelectionWindow } from "./ThemeSelectionWindow"
import { Window } from "./Window"

export class ThemeEditorWindow extends Window {
  app: App

  private pickers: Record<string, HTMLDivElement> = {}
  private handlers: ((...args: any[]) => void)[] = []
  private linkBlacklist = new Set<ThemeProperty>()
  static isOpen = false

  constructor(app: App) {
    super({
      title: "Theme Color Editor",
      width: 500,
      height: 400,
      win_id: "theme-editor",
      disableClose: true,
    })
    this.app = app
    this.initView()
    ThemeEditorWindow.isOpen = true
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

    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const menu_options_left = document.createElement("div")
    menu_options_left.classList.add("menu-left")
    const menu_options_right = document.createElement("div")
    menu_options_right.classList.add("menu-right")
    menu_options.appendChild(menu_options_left)
    menu_options.appendChild(menu_options_right)

    const cancel = document.createElement("button")
    cancel.innerText = "Cancel"
    cancel.onclick = () => {
      this.closeWindow()
      Themes.loadTheme(Options.general.theme)
      this.app.windowManager.openWindow(new ThemeSelectionWindow(this.app))
    }
    menu_options_left.appendChild(cancel)

    const create_btn = document.createElement("button")
    create_btn.innerText = "Save"
    create_btn.classList.add("confirm")
    create_btn.onclick = () => {
      Themes.setUserTheme(Options.general.theme, Themes.getCurrentTheme())
      Themes.loadTheme(Options.general.theme)
      this.app.windowManager.openWindow(new ThemeSelectionWindow(this.app))
      this.closeWindow()
    }
    menu_options_right.appendChild(create_btn)

    padding.replaceChildren(colorGrid, menu_options)

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
      if (colorPicker.isActive()) return
      colorPicker.value = c
    }

    const setValue = (color: Color) => {
      const newTheme = Themes.getCurrentTheme()
      newTheme[opt.id] = color
      Themes._applyTheme(this.updateLinks(opt.id, newTheme))
    }

    const container = document.createElement("div")
    container.classList.add("theme-color-cell")

    if (THEME_PROPERTY_DESCRIPTIONS[opt.id] != "")
      tippy(container, {
        content: THEME_PROPERTY_DESCRIPTIONS[opt.id],
      })

    const links = THEME_GENERATOR_LINKS[opt.id]

    if (links) {
      container.onmouseover = () => {
        Object.keys(links).forEach(key => {
          if (this.linkBlacklist.has(key as ThemeProperty)) return
          this.pickers[key].classList.add("linked")
        })
      }
      container.onmouseout = () => {
        Object.keys(links).forEach(key => {
          this.pickers[key].classList.remove("linked")
        })
      }
    }

    const label = document.createElement("div")
    label.innerText = opt.label

    const colorLabel = document.createElement("div")
    colorLabel.classList.add("theme-color-detail")

    const colorPicker = ColorPicker.create({
      value: "white",
      width: 30,
      height: 30,
    })

    colorPicker.onColorChange = setValue

    container.replaceChildren(label, colorLabel, colorPicker)

    const linkId = this.getLink(opt.id)
    if (linkId !== null) {
      const link = document.createElement("div")
      link.classList.add("ico-checkbox")
      const on = Icons.getIcon("LINK", 16)
      const off = Icons.getIcon("LINK_BROKEN", 16)

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

      tippy(link, {
        onShow(inst) {
          inst.setContent(currentValue ? `Linked to ${linkId}` : "Unlinked")
        },
      })

      tippy(link, {
        trigger: "click",
        onShow(inst) {
          inst.setContent(currentValue ? `Linked to ${linkId}` : "Unlinked")
        },
      })

      update()

      link.replaceChildren(on, off)

      container.appendChild(link)

      const newSetInput = (color: Color) => {
        if (currentValue) {
          currentValue = false
          update()
        }
        setValue(color)
      }

      colorPicker.onColorChange = newSetInput
      // alphaInput.oninput = newSetInput
    }

    updateValue()

    EventHandler.on("themeChanged", updateValue)
    this.handlers.push(updateValue)
    this.pickers[opt.id] = container

    return container
  }

  getLink(id: ThemeProperty) {
    for (const [linker, links] of Object.entries(THEME_GENERATOR_LINKS)) {
      if (id in links) {
        return linker as ThemeProperty
      }
    }
    return null
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

  onClose(): void {
    ThemeEditorWindow.isOpen = false
  }
}
