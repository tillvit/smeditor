import { FederatedMouseEvent } from "pixi.js"
import { App } from "../../App"
import { EditMode } from "../../chart/ChartManager"
import { KEYBIND_DATA } from "../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../data/MenubarData"
import { Keybinds } from "../../util/Keybinds"
import { Icons } from "../Icons"

export class ContextMenuPopup {
  private static menuElement: HTMLDivElement
  private static closeTimeout: NodeJS.Timeout
  static open(app: App, event: MouseEvent | FederatedMouseEvent) {
    if (app.chartManager.getMode() == EditMode.View) return
    this.buildMenu(app)
    this.menuElement.style.display = "none"
    setTimeout(() => this.fitContextMenu(event))

    this.menuElement.classList.add("entering")
    clearTimeout(this.closeTimeout)
    setTimeout(() => this.menuElement?.classList.remove("entering"), 300)
    this.menuElement.style.left = event.clientX + "px"
    this.menuElement.style.top = event.clientY + "px"
  }

  private static fitContextMenu(event: MouseEvent | FederatedMouseEvent) {
    this.menuElement.style.display = ``
    const bounds = this.menuElement.getBoundingClientRect()
    const bottomRestriction = window.innerHeight - bounds.bottom - 20
    const rightRestriction = window.innerWidth - bounds.right - 20
    if (bottomRestriction < 0)
      this.menuElement.style.top = event.clientY + bottomRestriction + "px"

    if (rightRestriction < 0)
      this.menuElement.style.left = event.clientX + rightRestriction + "px"

    this.menuElement.style.transformOrigin = `${Math.max(
      0,
      -rightRestriction
    )}px ${Math.max(0, -bottomRestriction)}px`
  }

  static close() {
    if (!this.menuElement) return
    this.menuElement.classList.add("exiting")
    this.closeTimeout = setTimeout(
      () => this.menuElement.replaceChildren(),
      300
    )
  }

  private static buildMenu(app: App) {
    const menu = document.createElement("div")
    menu.appendChild(
      this.createElement(app, {
        type: "selection",
        id: "cut",
      })
    )
    menu.appendChild(
      this.createElement(app, {
        type: "selection",
        id: "copy",
      })
    )
    menu.appendChild(
      this.createElement(app, {
        type: "selection",
        id: "paste",
      })
    )
    if (
      app.chartManager.getMode() == EditMode.Edit &&
      app.chartManager.hasNoteSelection()
    ) {
      const separator = document.createElement("div")
      separator.classList.add("separator")
      menu.appendChild(separator)
      MENUBAR_DATA["selection"].options.slice(0, -2).forEach(option => {
        menu.appendChild(this.createElement(app, option))
      })
    }
    this.menuElement = menu
    menu.id = "context-menu"
    document.getElementById("context-menu")?.replaceWith(this.menuElement)
  }

  private static createElement(app: App, data: MenuOption): HTMLDivElement {
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
        const meta = KEYBIND_DATA[data.id]
        title_bar_right = document.createElement("div")
        title_bar_right.innerText = Keybinds.getKeybindString(data.id)
        title_bar_right.classList.add("keybind", "unselectable")
        title.innerText = meta?.label ?? data.id

        let disabled = meta?.disabled ?? true
        if (typeof disabled == "function") disabled = disabled(app)
        if (disabled) item.classList.add("disabled")

        item.addEventListener("click", () => {
          if (disabled) return
          meta?.callback(app)
          this.close()
        })
      } else {
        title_bar_right = document.createElement("img")
        title_bar_right.classList.add("icon")
        title_bar_right.src = Icons.CHEVRON
        title_bar_right.style.transform = "rotate(-90deg)"
        title.innerText =
          typeof data.title == "function" ? data.title(app) : data.title
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
          .map(x => this.createElement(app, x))
          .forEach(x => dropdown.appendChild(x))
      }
      if (data.type == "checkbox") {
        let checked = data.checked
        if (typeof checked == "function") checked = checked(app)
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
          ...data.options.map(x => this.createElement(app, x))
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
