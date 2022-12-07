import { App } from "../App"
import { KEYBINDS } from "../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../data/MenubarData"

export class MenubarManager {

  app: App
  view: HTMLDivElement

  constructor (app: App, view: HTMLDivElement) {
    this.app = app
    this.view = view
    let elements: HTMLDivElement[] = Object.values(MENUBAR_DATA).map(value=>this.createElement(value))
    view.replaceChildren(...elements)
  }

  createElement(data: MenuOption): HTMLDivElement {
    if (data.type == "seperator") {
      let seperator = document.createElement("div") 
      seperator.classList.add("seperator")
      return seperator
    }
    if (data.type == "selection" || data.type == "checkbox" || data.type == "dropdown") {
      let item = document.createElement("div") 
      let title_bar = document.createElement("div")
      let title = document.createElement("div")
      let title_bar_right;
      if (data.type == "selection" || data.type == "checkbox"){
        let meta = KEYBINDS[data.id]
        title_bar_right = document.createElement("div")
        title_bar_right.innerText = this.app.keybinds.getKeybindString(data.id)
        title_bar_right.classList.add("keybind", "unselectable")
        title.innerText = meta.label
  
        let disabled = meta.disabled
        if (typeof disabled == "function") disabled = disabled(this.app)
        if (disabled) item.classList.add("disabled")
  
        item.onclick = () => {
          meta.callback(this.app)
          let dropdown = item.closest(".menu-main")!.querySelector(".dropdown")!
          dropdown.replaceChildren()
        }
      } else {
        title_bar_right = document.createElement("img")
        title_bar_right.classList.add("icon")
        title_bar_right.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAlklEQVRIie3UsQ3CUAyE4U/MQKCCYUCipSFMEwYKFYvAFCAhGCIUoUieoLMrOMmddb98z8/8FaQlLrhhnQFo0L3rgSoasBkAOhyjAdAWkDoaMMV9AHhiHg3ZGk9xigbQ558aVaXfpNStqo2nOHxrnESTI5QeUeoj7wvzNtL800ebRQLKaHaR5unHLv1cL3DGFato8x/XCwFMPpf5ayxcAAAAAElFTkSuQmCC"
        title.innerText = data.title
      }
  
      title_bar.appendChild(title)
      title_bar.appendChild(title_bar_right)
      item.appendChild(title_bar)
      item.classList.add("menu-item")
      title_bar.classList.add("menu-item-title", "menu-hover")
      title.classList.add("title", "unselectable")
  
      if (data.type == "dropdown") {
        let dropdown = document.createElement("div")
        item.appendChild(dropdown)
        dropdown.classList.add("dropdown")
        data.options.map(x=>this.createElement(x)).forEach(x=>dropdown.appendChild(x))
      }
      if (data.type == "checkbox") {
        let checked = data.checked
        if (typeof checked == "function") checked = checked(this.app)
        if (checked) title.innerText = "✓ " + title.innerText
      }
      return item
    }
    if (data.type == "menu") {
      let menuitem = document.createElement("div")
      let title = document.createElement("div")
      let dropdown = document.createElement("div")
      menuitem.appendChild(title)
      title.innerText = data.title
      menuitem.appendChild(dropdown)
      title.classList.add("title", "unselectable")
      menuitem.classList.add("menu-item","menu-main")
      title.classList.add("menu-hover")
      dropdown.classList.add("dropdown", "unselectable")
      menuitem.onmouseenter = () => { 
        dropdown.replaceChildren(...data.options.map(x=>this.createElement(x)))
      }
      menuitem.onmouseleave = () => { 
        dropdown.replaceChildren()
      }
     
      return menuitem
    }
    return document.createElement("div")
  }
}

