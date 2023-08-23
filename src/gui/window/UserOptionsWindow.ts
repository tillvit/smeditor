// import { App } from "../../App"
// import { USER_OPTIONS_WINDOW_DATA } from "../../data/UserOptionsWindowData"
// import { Options, OptionsObject, VIEW_BLACKLIST } from "../../util/Options"
// import { clamp, roundDigit, safeParse } from "../../util/Util"
// import { Dropdown } from "../element/Dropdown"
// import { NumberSpinner } from "../element/NumberSpinner"
// import { Window } from "./Window"

// export class UserOptionsWindow extends Window {
//   app: App

//   constructor(app: App) {
//     super({
//       title: "Options",
//       width: 500,
//       height: 400,
//       disableClose: false,
//       win_id: "user_options",
//       blocking: false,
//     })
//     this.app = app
//     this.initView()
//   }

//   initView(): void {
//     // Create the window
//     this.viewElement.replaceChildren()

//     //Padding container
//     const padding = document.createElement("div")
//     padding.classList.add("padding")

//     const scroll = document.createElement("div")
//     scroll.classList.add("pref-selector")
//     const divs = this.createDiv()
//     scroll.replaceChildren(...divs)

//     padding.appendChild(scroll)
//     this.viewElement.appendChild(padding)
//   }

//   private createDiv(prefix?: string): HTMLDivElement[] {
//     prefix = prefix ?? ""
//     const obj = this.getObjects(prefix)
//     prefix = prefix == "" ? "" : prefix + "."
//     if (!obj) return []
//     return Object.entries(obj)
//       .filter(entry => !VIEW_BLACKLIST.includes(option.id))
//       .map(entry => this.makeObj(prefix!, entry))
//   }

//   private makeObj(
//     prefix: string,
//     entry: [string, string | number | boolean | object]
//   ): HTMLDivElement {
//     const item = document.createElement("div")
//     item.classList.add("pref-item")
//     item.dataset.id = option.id

//     const label = document.createElement("div")
//     label.classList.add("pref-label", "collapsed")

//     item.appendChild(label)

//     if (typeof value == "object") {
//       const dd_icon = document.createElement("img")
//       dd_icon.classList.add("icon")
//       dd_icon.classList.add("folder-icon")
//       dd_icon.src =
//         "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbklEQVRIie2PMQqAMAxFXwfP6qJVPIjYzcOKdUkhQ0BaCoLkLS3k818CjuN8ztApYzIDl7xvmalFsAIZuIFozKPMMrC0CAJwKIkuGVX5KdkmLEm3ci1JSlLKU49yLSmXVG1es0EANvnvInKcP/AA784fpjlWwNQAAAAASUVORK5CYII="
//       label.appendChild(dd_icon)
//     }

//     const title = document.createElement("div")
//     title.innerText = entry[0]
//     title.classList.add("title")
//     label.appendChild(title)

//     if (typeof value != "object") {
//       let input: HTMLElement
//       if (USER_OPTIONS_WINDOW_DATA[option.id]) {
//         const data = USER_OPTIONS_WINDOW_DATA[option.id]
//         if (!data.input) return item
//         title.innerText = data.label
//         switch (data.input.type) {
//           case "checkbox": {
//             const checkbox = document.createElement("input")
//             const callback = data.input.onChange
//             checkbox.type = "checkbox"
//             checkbox.checked = value as boolean
//             checkbox.onblur = null
//             checkbox.onchange = () => {
//               Options.applyOption([option.id, checkbox.checked])
//               callback?.(checkbox.checked)
//             }
//             checkbox.classList.add("pref-input", "right")
//             checkbox.onkeydown = ev => {
//               if (ev.key == "Enter") checkbox.blur()
//             }
//             input = checkbox
//             break
//           }
//           case "dropdown": {
//             if (data.input.advanced) {
//               const deserializer = data.input.transformers.deserialize
//               const serializer = data.input.transformers.serialize
//               const callback = data.input.onChange
//               const dropdown = Dropdown.create(
//                 data.input.items,
//                 serializer(value)
//               )
//               dropdown.onChange(value => {
//                 Options.applyOption([option.id, deserializer(value)])
//                 callback?.(deserializer(value))
//               })
//               dropdown.view.classList.add("pref-input", "right")
//               input = dropdown.view
//             } else {
//               const callback = data.input.onChange
//               const dropdown = Dropdown.create(
//                 data.input.items,
//                 value as string | number
//               )
//               dropdown.onChange(value => {
//                 Options.applyOption([option.id, value])
//                 callback?.(value)
//               })
//               dropdown.view.classList.add("pref-input", "right")
//               input = dropdown.view
//             }
//             break
//           }
//           case "number": {
//             const deserializer =
//               data.input.transformers?.deserialize ?? ((value: number) => value)
//             const serializer =
//               data.input.transformers?.serialize ?? ((value: number) => value)
//             const callback = data.input.onChange
//             const spinner = NumberSpinner.create(
//               serializer(value as number),
//               data.input.step,
//               data.input.precision,
//               data.input.min,
//               data.input.max
//             )
//             spinner.onChange = value => {
//               if (!value) {
//                 spinner.setValue(serializer(value as number))
//                 return
//               }
//               Options.applyOption([option.id, deserializer(value)])
//               callback?.(deserializer(value))
//             }
//             input = spinner.view
//             break
//           }
//           case "slider": {
//             const deserializer =
//               data.input.transformers?.deserialize ?? ((value: number) => value)
//             const serializer =
//               data.input.transformers?.serialize ?? ((value: number) => value)
//             const callback = data.input.onChange
//             const container = document.createElement("div")
//             const slider = document.createElement("input")
//             slider.type = "range"
//             slider.min = data.input.min?.toString() ?? ""
//             slider.max = data.input.max?.toString() ?? ""
//             slider.step = data.input.step?.toString() ?? "1"
//             slider.value = serializer(value as number).toString()
//             const numberInput = document.createElement("input")
//             numberInput.type = "text"
//             numberInput.value = (
//               Math.round(serializer(value as number) * 1000) / 1000
//             ).toString()
//             const hardMin =
//               data.input.min ?? data.input.hardMin ?? -Number.MAX_VALUE
//             const hardMax =
//               data.input.max ?? data.input.hardMax ?? Number.MAX_VALUE
//             numberInput.onblur = () => {
//               let value = safeParse(numberInput.value)
//               value = clamp(value, hardMin, hardMax)
//               numberInput.value = roundDigit(value, 3).toString()
//               numberInput.blur()
//               if (numberInput.value == "")
//                 numberInput.value = serializer(value as number).toString()
//               else Options.applyOption([option.id, deserializer(value)])
//               slider.value = value.toString()
//               callback?.(deserializer(value))
//             }
//             numberInput.oninput = () => {
//               numberInput.value = numberInput.value.replaceAll(
//                 /[^.0-9+-/*]/g,
//                 ""
//               )
//             }
//             slider.oninput = () => {
//               const value = parseFloat(slider.value)
//               numberInput.value = roundDigit(value, 3).toString()
//               Options.applyOption([option.id, deserializer(value)])
//             }
//             numberInput.classList.add("pref-input", "right")
//             numberInput.style.width = "50px"
//             numberInput.onkeydown = ev => {
//               if (ev.key == "Enter") numberInput.blur()
//             }
//             container.appendChild(slider)
//             container.appendChild(numberInput)
//             input = container
//             break
//           }
//           case "text": {
//             const callback = data.input.onChange
//             const textInput = document.createElement("input")
//             textInput.type = "text"
//             textInput.value = value.toString()
//             textInput.onblur = () => {
//               Options.applyOption([option.id, textInput.value])
//               callback?.(textInput.value)
//             }
//             textInput.classList.add("pref-input", "right")
//             textInput.onkeydown = ev => {
//               if (ev.key == "Enter") textInput.blur()
//             }
//             input = textInput
//             break
//           }
//         }
//         if (data.margin) {
//           label.style.marginBottom = "8px"
//         }
//       } else {
//         console.log("No prefrences entry for " + option.id + "!")
//         input = this.makeDefaultObject(prefix, entry)
//       }
//       label.appendChild(input)
//     } else {
//       const dropdown = document.createElement("div")
//       dropdown.classList.add("pref-dd")
//       if (USER_OPTIONS_WINDOW_DATA[option.id]?.label) {
//         title.innerText = USER_OPTIONS_WINDOW_DATA[option.id].label
//       }
//       item.appendChild(dropdown)
//       label.onclick = () => {
//         if (dropdown.childElementCount == 0) {
//           label.classList.remove("collapsed")
//           dropdown.replaceChildren(...this.createDiv(option.id))
//         } else {
//           label.classList.add("collapsed")
//           dropdown.replaceChildren()
//         }
//       }
//     }

//     return item
//   }

//   private makeDefaultObject(
//     prefix: string,
//     entry: [string, string | number | boolean | object]
//   ): HTMLInputElement {
//     const defaultOption = Options.getDefaultOption(option.id)!
//     const input = document.createElement("input")
//     input.type = "text"
//     input.value = (value as string | number | boolean) + ""
//     input.onblur = () => {
//       Options.applyOption([option.id, input.value])
//     }
//     if (typeof defaultOption == "boolean") {
//       input.type = "checkbox"
//       input.checked = value as boolean
//       input.onblur = null
//       input.onchange = () => {
//         Options.applyOption([option.id, input.checked])
//       }
//     }
//     if (typeof defaultOption == "number") {
//       input.oninput = () => {
//         input.value = input.value.replaceAll(/[^.0-9+-]/g, "")
//       }
//       input.onblur = () => {
//         input.value = safeParse(input.value).toString()
//         Options.applyOption([option.id, Number(input.value)])
//       }
//     }
//     input.classList.add("pref-input", "right")
//     input.onkeydown = ev => {
//       if (ev.key == "Enter") input.blur()
//     }

//     return input
//   }

//   private getObjects(id: string): OptionsObject | undefined {
//     const path = id.split(".")
//     let obj: OptionsObject = Options as unknown as OptionsObject
//     if (id == "") return obj
//     for (const part of path) {
//       if (part in obj) obj = obj[part] as OptionsObject
//       else return undefined
//     }
//     return obj
//   }
// }
import tippy from "tippy.js"
import { App } from "../../App"
import { MenuOption } from "../../data/MenubarData"
import {
  USER_OPTIONS_WINDOW_DATA,
  UserOption,
  UserOptionGroup,
} from "../../data/UserOptionsWindowData"
import { Options } from "../../util/Options"
import { clamp, roundDigit, safeParse } from "../../util/Util"
import { Icons } from "../Icons"
import { Dropdown } from "../element/Dropdown"
import { NumberSpinner } from "../element/NumberSpinner"
import { Window } from "./Window"

export class UserOptionsWindow extends Window {
  app: App
  private observer?: IntersectionObserver
  private sectionContainer?: HTMLDivElement

  constructor(app: App) {
    super({
      title: "Options",
      width: 600,
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

    const container = document.createElement("div")
    container.classList.add("pref-container")

    const search = document.createElement("div")
    search.classList.add("pref-search")

    const searchBar = document.createElement("input")
    searchBar.classList.add("pref-search-bar")
    searchBar.type = "text"
    searchBar.placeholder = "Search for an option..."

    searchBar.oninput = () => {
      section.replaceChildren()
      option.replaceChildren(
        ...this.createOptions(this.filterOptions(searchBar.value))
      )
    }

    search.appendChild(searchBar)

    const scrollers = document.createElement("div")
    scrollers.classList.add("pref-scrollers")

    const section = document.createElement("div")
    section.classList.add("pref-section-scroller")

    this.sectionContainer = section

    const option = document.createElement("div")
    option.classList.add("pref-option-scroller")

    scrollers.replaceChildren(section, option)

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = (entry.target as HTMLDivElement).dataset.id
        const el = section.querySelector(`.pref-section[data-id=${id}]`)
        if (!el) return
        if (entry.intersectionRatio > 0) {
          el.classList.add("selected")
        } else {
          el.classList.remove("selected")
        }
      })
    }, {})

    container.replaceChildren(search, scrollers)

    section.replaceChildren()
    option.replaceChildren(...this.createOptions(USER_OPTIONS_WINDOW_DATA))
    padding.appendChild(container)
    this.viewElement.appendChild(padding)
  }

  private createOptions(options: UserOption[]) {
    return options.map(option => {
      const element = this.makeOption(option)
      if (option.type == "group") {
        this.observer!.observe(element)
        this.sectionContainer?.appendChild(this.createEmptyGroup(option))
      }
      return element
    })
  }

  private makeOption(option: UserOption): HTMLDivElement {
    const item = document.createElement("div")
    item.classList.add("pref-" + option.type)
    if (option.type == "group" || option.type == "item")
      item.dataset.id = option.id

    const label = document.createElement("div")
    label.classList.add(`pref-${option.type}-label`)

    if (option.label !== undefined) {
      label.innerText = option.label
      item.appendChild(label)
    }

    const revert = document.createElement("img")
    if (option.type == "item") {
      revert.src = Icons.REVERT
      revert.style.width = "12px"
      revert.addEventListener("click", () => {
        Options.applyOption([option.id, Options.getDefaultOption(option.id)])
        // Reload the option
        item.replaceWith(this.makeOption(option))
      })
      revert.style.display =
        Options.getDefaultOption(option.id) === Options.getOption(option.id)
          ? "none"
          : "block"
      item.appendChild(revert)
    }

    if (option.type == "item") {
      const optionValue = Options.getOption(option.id)
      let input: HTMLElement
      if (!option.input) return item
      label.innerText = option.label
      switch (option.input.type) {
        case "checkbox": {
          const checkbox = document.createElement("input")
          const callback = option.input.onChange
          checkbox.type = "checkbox"
          checkbox.checked = optionValue
          checkbox.onblur = null
          checkbox.onchange = () => {
            Options.applyOption([option.id, checkbox.checked])
            revert.style.display =
              Options.getDefaultOption(option.id) ===
              Options.getOption(option.id)
                ? "none"
                : "block"
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
          if (option.input.advanced) {
            const deserializer = option.input.transformers.deserialize
            const serializer = option.input.transformers.serialize
            const callback = option.input.onChange
            const dropdown = Dropdown.create(
              option.input.items,
              serializer(optionValue)
            )
            dropdown.onChange(value => {
              Options.applyOption([option.id, deserializer(value)])
              revert.style.display =
                Options.getDefaultOption(option.id) ===
                Options.getOption(option.id)
                  ? "none"
                  : "block"
              callback?.(deserializer(value))
            })
            dropdown.view.classList.add("pref-input", "right")
            input = dropdown.view
          } else {
            const callback = option.input.onChange
            const dropdown = Dropdown.create(option.input.items, optionValue)
            dropdown.onChange(value => {
              Options.applyOption([option.id, value])
              revert.style.display =
                Options.getDefaultOption(option.id) ===
                Options.getOption(option.id)
                  ? "none"
                  : "block"
              callback?.(value)
            })
            dropdown.view.classList.add("pref-input", "right")
            input = dropdown.view
          }
          break
        }
        case "number": {
          const deserializer =
            option.input.transformers?.deserialize ?? ((value: number) => value)
          const serializer =
            option.input.transformers?.serialize ?? ((value: number) => value)
          const callback = option.input.onChange
          const spinner = NumberSpinner.create(
            serializer(optionValue as number),
            option.input.step,
            option.input.precision,
            option.input.min,
            option.input.max
          )
          spinner.onChange = value => {
            if (!value) {
              spinner.setValue(serializer(value as number))
              return
            }
            Options.applyOption([option.id, deserializer(value)])
            revert.style.display =
              Options.getDefaultOption(option.id) ===
              Options.getOption(option.id)
                ? "none"
                : "block"
            callback?.(deserializer(value))
          }
          input = spinner.view
          break
        }
        case "slider": {
          const deserializer =
            option.input.transformers?.deserialize ?? ((value: number) => value)
          const serializer =
            option.input.transformers?.serialize ?? ((value: number) => value)
          const callback = option.input.onChange
          const container = document.createElement("div")
          container.style.display = "flex"
          container.style.alignItems = "center"
          const slider = document.createElement("input")
          slider.type = "range"
          slider.min = option.input.min?.toString() ?? ""
          slider.max = option.input.max?.toString() ?? ""
          slider.step = option.input.step?.toString() ?? "1"
          slider.value = serializer(optionValue as number).toString()
          const numberInput = document.createElement("input")
          numberInput.type = "text"
          numberInput.value = (
            Math.round(serializer(optionValue as number) * 1000) / 1000
          ).toString()
          const hardMin =
            option.input.min ?? option.input.hardMin ?? -Number.MAX_VALUE
          const hardMax =
            option.input.max ?? option.input.hardMax ?? Number.MAX_VALUE
          numberInput.onblur = () => {
            let value = safeParse(numberInput.value)
            value = clamp(value, hardMin, hardMax)
            numberInput.value = roundDigit(value, 3).toString()
            numberInput.blur()
            if (numberInput.value == "")
              numberInput.value = serializer(value).toString()
            else Options.applyOption([option.id, deserializer(value)])
            slider.value = value.toString()
            revert.style.display =
              Options.getDefaultOption(option.id) ===
              Options.getOption(option.id)
                ? "none"
                : "block"
            callback?.(deserializer(value))
          }
          numberInput.oninput = () => {
            numberInput.value = numberInput.value.replaceAll(/[^.0-9+-/*]/g, "")
          }
          slider.oninput = () => {
            const value = parseFloat(slider.value)
            numberInput.value = roundDigit(value, 3).toString()
            Options.applyOption([option.id, deserializer(value)])
            revert.style.display =
              Options.getDefaultOption(option.id) ===
              Options.getOption(option.id)
                ? "none"
                : "block"
          }
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
          const callback = option.input.onChange
          const textInput = document.createElement("input")
          textInput.type = "text"
          textInput.value = optionValue.toString()
          textInput.onblur = () => {
            Options.applyOption([option.id, textInput.value])
            revert.style.display =
              Options.getDefaultOption(option.id) ===
              Options.getOption(option.id)
                ? "none"
                : "block"
            callback?.(textInput.value)
          }
          textInput.onkeydown = ev => {
            if (ev.key == "Enter") textInput.blur()
          }
          input = textInput
          break
        }
      }
      input.classList.add("pref-item-input")
      item.appendChild(input)
    } else {
      const children = document.createElement("div")
      children.classList.add("pref-children")
      item.appendChild(children)
      children.replaceChildren(...this.createOptions(option.children))
    }

    if (option.type == "item" && option.tooltip !== undefined) {
      tippy(item, {
        content: option.tooltip,
      })
    }

    return item
  }

  private filterOptions(
    filter: string,
    options: UserOption[] = USER_OPTIONS_WINDOW_DATA
  ) {
    const filteredOptions: UserOption[] = []
    options.forEach(option => {
      if (
        option.label &&
        option.label.toLowerCase().includes(filter.toLowerCase())
      ) {
        filteredOptions.push(option)
        return
      }
      if (option.type == "group" || option.type == "subgroup") {
        const filteredChildren = this.filterOptions(filter, option.children)
        if (filteredChildren.length != 0)
          filteredOptions.push({ ...option, children: filteredChildren })
      }
    })
    return filteredOptions
  }

  private static expandMenubarOptions(option: MenuOption): string[] {
    switch (option.type) {
      case "menu":
      case "dropdown":
        return option.options
          .map(item => this.expandMenubarOptions(item))
          .flat()
      case "selection":
      case "checkbox":
        return [option.id]
      case "seperator":
        return []
    }
  }

  private createEmptyGroup(optionGroup: UserOptionGroup) {
    const sectionElement = document.createElement("div")
    sectionElement.classList.add("pref-section")
    sectionElement.dataset.id = optionGroup.id
    sectionElement.innerText = optionGroup.label

    sectionElement.onclick = () => {
      sectionElement
        .parentElement!.parentElement!.querySelector(
          `.pref-group[data-id=${optionGroup.id}]`
        )!
        .scrollIntoView()
    }

    return sectionElement
  }

  // private createKeybindItem(id: string) {
  //   const keybindElement = document.createElement("div")
  //   keybindElement.classList.add("pref-keybind")
  //   keybindElement.dataset.id = id

  //   const label = document.createElement("div")
  //   label.classList.add("pref-keybind-label")
  //   label.innerText = KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label

  //   const revert = document.createElement("img")
  //   revert.src = Icons.REVERT
  //   revert.style.width = "12px"
  //   revert.addEventListener("click", () => {
  //     Keybinds.revertKeybind(id)
  //     this.conflictMap = this.calculateConflicts()
  //     keybindElement.replaceWith(this.createKeybindItem(id))
  //   })
  //   revert.style.display = Keybinds.checkIsDefault(id) ? "none" : "block"

  //   const combos = document.createElement("div")
  //   combos.classList.add("pref-keybind-combos")

  //   combos.replaceChildren(
  //     ...Keybinds.getCombosForKeybind(id).map(combo => {
  //       const comboElement = document.createElement("button")
  //       comboElement.classList.add("pref-keybind-combo")
  //       comboElement.innerText = Keybinds.getComboString(combo)
  //       if (this.conflictMap.get(Keybinds.getComboString(combo))!.length > 1)
  //         comboElement.classList.add("conflict")
  //       comboElement.onclick = () => {
  //         Keybinds.removeKeybind(id, combo)
  //         this.conflictMap = this.calculateConflicts()
  //         keybindElement.replaceWith(this.createKeybindItem(id))
  //       }
  //       return comboElement
  //     })
  //   )

  //   keybindElement.replaceChildren(label, revert, combos)

  //   return keybindElement
  // }

  onClose(): void {
    this.observer?.disconnect()
  }
}
