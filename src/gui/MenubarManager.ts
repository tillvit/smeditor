import { App } from "../App"
import { KEYBINDS } from "../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../data/MenubarData"
import { Keybinds } from "../listener/Keybinds"

export class MenubarManager {
  app: App
  view: HTMLDivElement

  constructor(app: App, view: HTMLDivElement) {
    this.app = app
    this.view = view
    const elements: HTMLDivElement[] = Object.values(MENUBAR_DATA).map(value =>
      this.createElement(value)
    )
    view.replaceChildren(...elements)
  }

  createElement(data: MenuOption): HTMLDivElement {
    if (data.type == "seperator") {
      const seperator = document.createElement("div")
      seperator.classList.add("seperator")
      return seperator
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
        const meta = KEYBINDS[data.id]
        title_bar_right = document.createElement("div")
        title_bar_right.innerText = Keybinds.getKeybindString(data.id)
        title_bar_right.classList.add("keybind", "unselectable")
        title.innerText = meta.label

        let disabled = meta.disabled
        if (typeof disabled == "function") disabled = disabled(this.app)
        if (disabled) item.classList.add("disabled")

        item.addEventListener("click", () => {
          meta.callback(this.app)
          const dropdown = item
            .closest(".menu-main")!
            .querySelector(".menubar-dropdown")!
          dropdown.replaceChildren()
        })
      } else {
        title_bar_right = document.createElement("img")
        title_bar_right.classList.add("icon")
        title_bar_right.src =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAlklEQVRIie3UsQ3CUAyE4U/MQKCCYUCipSFMEwYKFYvAFCAhGCIUoUieoLMrOMmddb98z8/8FaQlLrhhnQFo0L3rgSoasBkAOhyjAdAWkDoaMMV9AHhiHg3ZGk9xigbQ558aVaXfpNStqo2nOHxrnESTI5QeUeoj7wvzNtL800ebRQLKaHaR5unHLv1cL3DGFato8x/XCwFMPpf5ayxcAAAAAElFTkSuQmCC"
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
