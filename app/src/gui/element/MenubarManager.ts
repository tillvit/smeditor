import { App } from "../../App"
import { KEYBIND_DATA } from "../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../data/MenubarData"
import { Flags } from "../../util/Flags"
import { Keybinds } from "../../util/Keybinds"
import { Icons } from "../Icons"

export class MenubarManager {
  app: App
  view: HTMLDivElement

  constructor(app: App, view: HTMLDivElement) {
    this.app = app
    this.view = view
    if (!Flags.menuBar) return
    const elements: HTMLDivElement[] = Object.values(MENUBAR_DATA).map(value =>
      this.createElement(value)
    )
    view.replaceChildren(...elements)
  }

  createElement(data: MenuOption): HTMLDivElement {
    if (data.type == "separator") {
      const separator = document.createElement("div")
      separator.classList.add("separator")
      return separator
    }
    if (
      data.type == "selection" ||
      data.type == "checkbox" ||
      data.type == "dropdown"
    ) {
      const item = document.createElement("div")
      const title_bar = document.createElement("div")
      const title = document.createElement("div")
      let title_bar_right
      if (data.type == "selection" || data.type == "checkbox") {
        const meta = KEYBIND_DATA[data.id] ?? {
          label: data.id,
          combos: [],
          callback: () => {},
        }
        title_bar_right = document.createElement("div")
        title_bar_right.innerText = Keybinds.getKeybindString(data.id)
        title_bar_right.classList.add("keybind", "unselectable")
        title.innerText = meta.label

        let disabled = meta.disabled
        if (typeof disabled == "function") disabled = disabled(this.app)
        if (disabled) item.classList.add("disabled")

        item.addEventListener("click", () => {
          let disabled = meta.disabled
          if (typeof disabled == "function") disabled = disabled(this.app)
          if (!disabled) meta.callback(this.app)
          const dropdown = item
            .closest(".menu-main")!
            .querySelector(".menubar-dropdown")!
          dropdown.replaceChildren()
        })
      } else {
        title_bar_right = Icons.getIcon("CHEVRON", 16)
        title_bar_right.style.transform = "rotate(-90deg)"
        title.innerText =
          typeof data.title == "function" ? data.title(this.app) : data.title
      }

      title_bar.appendChild(title)
      title_bar.appendChild(title_bar_right)
      item.appendChild(title_bar)
      item.classList.add("menu-item")
      title_bar.classList.add("menu-item-title", "menu-hover")
      title.classList.add("title", "unselectable")

      if (data.type == "dropdown") {
        const dropdown = document.createElement("div")
        item.appendChild(dropdown)
        dropdown.classList.add("menubar-dropdown")
        data.options
          .map(x => this.createElement(x))
          .forEach(x => dropdown.appendChild(x))
      }
      if (data.type == "checkbox") {
        let checked = data.checked
        if (typeof checked == "function") checked = checked(this.app)
        if (checked) title.innerText = "✓ " + title.innerText
      }
      return item
    }
    if (data.type == "menu") {
      const menuitem = document.createElement("div")
      const title = document.createElement("div")
      const dropdown = document.createElement("div")
      menuitem.appendChild(title)
      title.innerText = data.title
      menuitem.appendChild(dropdown)
      title.classList.add("title", "unselectable")
      menuitem.classList.add("menu-item", "menu-main")
      title.classList.add("menu-hover")
      dropdown.classList.add("menubar-dropdown", "unselectable")
      menuitem.onmouseenter = () => {
        dropdown.replaceChildren(
          ...data.options.map(x => this.createElement(x))
        )
      }
      menuitem.onmouseleave = () => {
        dropdown.replaceChildren()
      }

      return menuitem
    }
    return document.createElement("div")
  }
}
