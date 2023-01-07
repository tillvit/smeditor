import { App } from "../App"
import { Window } from "./Window"
import { Options, VIEW_BLACKLIST } from "../util/Options"
import { safeParse } from "../util/Util"

export class UserOptionsWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "Options",
      width: 500,
      height: 400,
      disableClose: false,
      win_id: "user_options",
      blocking: false,
    })
    this.app = app
    this.initView(this.viewElement)
  }

  initView(viewElement: HTMLDivElement): void {
    // Create the window
    viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const scroll = document.createElement("div")
    scroll.classList.add("pref-selector")
    const divs = this.createDiv()
    scroll.replaceChildren(...divs)

    padding.appendChild(scroll)
    viewElement.appendChild(padding)
  }

  private createDiv(prefix?: string): HTMLDivElement[] {
    prefix = prefix ?? ""
    const obj = this.getObjects(prefix)
    prefix = prefix == "" ? "" : prefix + "."
    if (!obj) return []
    return Object.entries(obj)
      .filter(entry => !VIEW_BLACKLIST.includes(prefix + entry[0]))
      .map(entry => this.makeObj(prefix!, entry))
  }

  private makeObj(
    prefix: string,
    entry: [string, string | number | boolean | object]
  ): HTMLDivElement {
    const item = document.createElement("div")
    item.classList.add("pref-item")
    item.dataset.id = prefix + entry[0]

    const label = document.createElement("div")
    label.classList.add("pref-label", "collapsed")

    item.appendChild(label)

    if (typeof entry[1] == "object") {
      const dd_icon = document.createElement("img")
      dd_icon.classList.add("icon")
      dd_icon.classList.add("folder-icon")
      dd_icon.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbklEQVRIie2PMQqAMAxFXwfP6qJVPIjYzcOKdUkhQ0BaCoLkLS3k818CjuN8ztApYzIDl7xvmalFsAIZuIFozKPMMrC0CAJwKIkuGVX5KdkmLEm3ci1JSlLKU49yLSmXVG1es0EANvnvInKcP/AA784fpjlWwNQAAAAASUVORK5CYII="
      label.appendChild(dd_icon)
    }

    const title = document.createElement("div")
    title.innerText = entry[0]
    title.classList.add("title")
    label.appendChild(title)

    if (typeof entry[1] != "object") {
      const defaultOption = Options.getDefaultOption(prefix + entry[0])!
      const input = document.createElement("input")
      input.type = "text"
      input.value = entry[1].toString()
      input.onblur = () => {
        Options.applyOption([prefix + entry[0], input.value])
      }
      if (typeof defaultOption == "boolean") {
        input.type = "checkbox"
        input.checked = entry[1] as boolean
        input.onblur = () => {
          Options.applyOption([prefix + entry[0], input.checked])
        }
      }
      if (typeof defaultOption == "number") {
        input.oninput = () => {
          input.value = input.value.replaceAll(/[^.0-9+-]/g, "")
        }
        input.onblur = () => {
          input.value = safeParse(input.value).toString()
          Options.applyOption([prefix + entry[0], Number(input.value)])
        }
      }
      input.classList.add("pref-input", "right")
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }

      label.appendChild(input)
    } else {
      const dd = document.createElement("div")
      dd.classList.add("pref-dd")
      item.appendChild(dd)
      label.onclick = () => {
        if (dd.childElementCount == 0) {
          label.classList.remove("collapsed")
          dd.replaceChildren(...this.createDiv(prefix + entry[0]))
        } else {
          label.classList.add("collapsed")
          dd.replaceChildren()
        }
      }
    }

    return item
  }

  private getObjects(
    id: string
  ): { [key: string]: string | number | boolean | object } | undefined {
    const path = id.split(".")
    let obj: any = Options
    if (id == "") return obj
    for (const part of path) {
      if (part in obj) obj = obj[part]
      else return undefined
    }
    return obj
  }
}
