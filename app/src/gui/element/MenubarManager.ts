import { App } from "../../App"
import { KEYBIND_DATA } from "../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../data/MenubarData"
import { Flags } from "../../util/Flags"
import { Keybinds } from "../../util/Keybinds"
import { Icons } from "../Icons"

export class MenubarManager {
  app: App
  view: HTMLDivElement
  clicked = false

  constructor(app: App, view: HTMLDivElement) {
    this.app = app
    this.view = view
    if (!Flags.menuBar) return
    const elements: HTMLDivElement[] = Object.values(MENUBAR_DATA).map(value =>
      this.createElement(value)
    )
    view.replaceChildren(...elements)
    document.addEventListener("pointerdown", event => {
      if (this.view.contains(event.target as Node)) return
      this.clicked = false
      elements.forEach(el => {
        el.classList.remove("selected")
        const dropdown = el.querySelector(".menubar-dropdown")
        if (dropdown) {
          dropdown.replaceChildren()
          dropdown.classList.remove("selected")
        }
      })
    })
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

        let visible = meta.visible
        if (visible === undefined) visible = true
        if (typeof visible == "function") visible = visible(this.app)
        if (!visible) return document.createElement("div")

        item.addEventListener("click", event => {
          let disabled = meta.disabled
          if (typeof disabled == "function") disabled = disabled(this.app)
          if (!disabled) meta.callback(this.app)
          event.stopImmediatePropagation()
          const dropdown = item
            .closest(".menu-main")!
            .querySelector(".menubar-dropdown")!
          dropdown.replaceChildren()
          dropdown.classList.remove("selected")
          this.clicked = false
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

      title_bar.onmouseenter = () => {
        item.parentElement!.querySelectorAll(".menu-item").forEach(el => {
          if (el != item) el.classList.remove("selected")
        })
      }

      if (data.type == "dropdown") {
        const dropdown = document.createElement("div")
        item.appendChild(dropdown)
        dropdown.classList.add("menubar-dropdown")
        data.options
          .map(x => this.createElement(x))
          .forEach(x => dropdown.appendChild(x))
        title_bar.onmouseenter = () => {
          item.parentElement!.querySelectorAll(".menu-item").forEach(el => {
            if (el != item) el.classList.remove("selected")
          })
          item.classList.add("selected")
        }
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
      menuitem.onclick = () => {
        this.clicked = true
        if (dropdown.childElementCount > 0) {
          dropdown.replaceChildren()
          this.clicked = false
          menuitem.classList.add("selected")
          return
        }
        dropdown.replaceChildren(
          ...data.options.map(x => this.createElement(x))
        )
        menuitem.classList.add("selected")
      }
      title.onmouseenter = () => {
        if (!this.clicked) return
        dropdown.replaceChildren(
          ...data.options.map(x => this.createElement(x))
        )
        menuitem.parentElement!.querySelectorAll(".menu-item").forEach(el => {
          if (el != menuitem) el.classList.remove("selected")
        })
        menuitem.classList.add("selected")
      }
      menuitem.onmouseleave = () => {
        if (this.clicked) return
        dropdown.replaceChildren()
        menuitem.classList.remove("selected")
      }

      return menuitem
    }
    return document.createElement("div")
  }
}
