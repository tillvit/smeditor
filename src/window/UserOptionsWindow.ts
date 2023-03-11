import { App } from "../App"
import { USER_OPTIONS_WINDOW_DATA } from "../data/UserOptionsWindowData"
import { Dropdown } from "../gui/element/Dropdown"
import { NumberSpinner } from "../gui/element/NumberSpinner"
import { Options, OptionsObject, VIEW_BLACKLIST } from "../util/Options"
import { clamp, roundDigit, safeParse } from "../util/Util"
import { Window } from "./Window"

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
    this.initView()
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const scroll = document.createElement("div")
    scroll.classList.add("pref-selector")
    const divs = this.createDiv()
    scroll.replaceChildren(...divs)

    padding.appendChild(scroll)
    this.viewElement.appendChild(padding)
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
      let input: HTMLElement
      if (USER_OPTIONS_WINDOW_DATA[prefix + entry[0]]) {
        const data = USER_OPTIONS_WINDOW_DATA[prefix + entry[0]]
        if (!data.input) return item
        title.innerText = data.label
        switch (data.input.type) {
          case "checkbox": {
            const checkbox = document.createElement("input")
            const callback = data.input.onChange
            checkbox.type = "checkbox"
            checkbox.checked = entry[1] as boolean
            checkbox.onblur = null
            checkbox.onchange = () => {
              Options.applyOption([prefix + entry[0], checkbox.checked])
              callback?.(checkbox.checked)
            }
            checkbox.classList.add("pref-input", "right")
            checkbox.onkeydown = ev => {
              if (ev.key == "Enter") checkbox.blur()
            }
            input = checkbox
            break
          }
          case "dropdown": {
            if (data.input.advanced) {
              const deserializer = data.input.transformers.deserialize
              const serializer = data.input.transformers.serialize
              const callback = data.input.onChange
              const dropdown = Dropdown.create(
                data.input.items,
                serializer(entry[1])
              )
              dropdown.onChange(value => {
                Options.applyOption([prefix + entry[0], deserializer(value)])
                callback?.(deserializer(value))
              })
              dropdown.view.classList.add("pref-input", "right")
              input = dropdown.view
            } else {
              const callback = data.input.onChange
              const dropdown = Dropdown.create(
                data.input.items,
                entry[1] as string | number
              )
              dropdown.onChange(value => {
                Options.applyOption([prefix + entry[0], value])
                callback?.(value)
              })
              dropdown.view.classList.add("pref-input", "right")
              input = dropdown.view
            }
            break
          }
          case "number": {
            const deserializer =
              data.input.transformers?.deserialize ?? ((value: number) => value)
            const serializer =
              data.input.transformers?.serialize ?? ((value: number) => value)
            const callback = data.input.onChange
            const spinner = NumberSpinner.create(
              serializer(entry[1] as number),
              data.input.step,
              data.input.precision,
              data.input.min,
              data.input.max
            )
            spinner.onChange = value => {
              if (!value) {
                spinner.setValue(serializer(entry[1] as number))
                return
              }
              Options.applyOption([prefix + entry[0], deserializer(value)])
              callback?.(deserializer(value))
            }
            input = spinner.view
            break
          }
          case "slider": {
            const deserializer =
              data.input.transformers?.deserialize ?? ((value: number) => value)
            const serializer =
              data.input.transformers?.serialize ?? ((value: number) => value)
            const callback = data.input.onChange
            const container = document.createElement("div")
            const slider = document.createElement("input")
            slider.type = "range"
            slider.min = data.input.min?.toString() ?? ""
            slider.max = data.input.max?.toString() ?? ""
            slider.step = data.input.step?.toString() ?? "1"
            slider.value = serializer(entry[1] as number).toString()
            const numberInput = document.createElement("input")
            numberInput.type = "text"
            numberInput.value = (
              Math.round(serializer(entry[1] as number) * 1000) / 1000
            ).toString()
            const hardMin =
              data.input.min ?? data.input.hardMin ?? -Number.MAX_VALUE
            const hardMax =
              data.input.max ?? data.input.hardMax ?? Number.MAX_VALUE
            numberInput.onblur = () => {
              let value = safeParse(numberInput.value)
              value = clamp(value, hardMin, hardMax)
              numberInput.value = roundDigit(value, 3).toString()
              numberInput.blur()
              if (numberInput.value == "")
                numberInput.value = serializer(entry[1] as number).toString()
              else Options.applyOption([prefix + entry[0], deserializer(value)])
              slider.value = value.toString()
              callback?.(deserializer(value))
            }
            numberInput.oninput = () => {
              numberInput.value = numberInput.value.replaceAll(
                /[^.0-9+-/*]/g,
                ""
              )
            }
            slider.oninput = () => {
              const value = parseFloat(slider.value)
              numberInput.value = roundDigit(value, 3).toString()
              Options.applyOption([prefix + entry[0], deserializer(value)])
            }
            numberInput.classList.add("pref-input", "right")
            numberInput.style.width = "50px"
            numberInput.onkeydown = ev => {
              if (ev.key == "Enter") numberInput.blur()
            }
            container.appendChild(slider)
            container.appendChild(numberInput)
            input = container
            break
          }
          case "text": {
            const callback = data.input.onChange
            const textInput = document.createElement("input")
            textInput.type = "text"
            textInput.value = entry[1].toString()
            textInput.onblur = () => {
              Options.applyOption([prefix + entry[0], textInput.value])
              callback?.(textInput.value)
            }
            textInput.classList.add("pref-input", "right")
            textInput.onkeydown = ev => {
              if (ev.key == "Enter") textInput.blur()
            }
            input = textInput
            break
          }
        }
        if (data.margin) {
          label.style.marginBottom = "8px"
        }
      } else {
        console.log("No prefrences entry for " + prefix + entry[0] + "!")
        input = this.makeDefaultObject(prefix, entry)
      }
      label.appendChild(input)
    } else {
      const dropdown = document.createElement("div")
      dropdown.classList.add("pref-dd")
      if (USER_OPTIONS_WINDOW_DATA[prefix + entry[0]]?.label) {
        title.innerText = USER_OPTIONS_WINDOW_DATA[prefix + entry[0]].label
      }
      item.appendChild(dropdown)
      label.onclick = () => {
        if (dropdown.childElementCount == 0) {
          label.classList.remove("collapsed")
          dropdown.replaceChildren(...this.createDiv(prefix + entry[0]))
        } else {
          label.classList.add("collapsed")
          dropdown.replaceChildren()
        }
      }
    }

    return item
  }

  private makeDefaultObject(
    prefix: string,
    entry: [string, string | number | boolean | object]
  ): HTMLInputElement {
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
      input.onblur = null
      input.onchange = () => {
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

    return input
  }

  private getObjects(id: string): OptionsObject | undefined {
    const path = id.split(".")
    let obj: OptionsObject = Options as unknown as OptionsObject
    if (id == "") return obj
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else return undefined
    }
    return obj
  }
}
