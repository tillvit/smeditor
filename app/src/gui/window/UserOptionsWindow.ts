import tippy from "tippy.js"
import { App } from "../../App"
import {
  USER_OPTIONS_WINDOW_DATA,
  UserOption,
  UserOptionGroup,
} from "../../data/UserOptionsWindowData"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { Icons } from "../Icons"
import { createValueInput } from "../element/ValueInput"
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

    EventHandler.on("resize", () => {
      this.move(
        window.innerWidth / 2 -
          (this.options.width / 2) * Options.general.uiScale,
        window.innerHeight / 2 -
          (this.options.height / 2) * Options.general.uiScale
      )
    })
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
    return options
      .filter(option => !option.disable?.(this.app))
      .map(option => {
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
    label.classList.add(`pref-${option.type}-label`, "label")

    if (option.label !== undefined) {
      label.innerText = option.label
      item.appendChild(label)
    }

    const revert = Icons.getIcon("REVERT", 12)
    if (option.type == "item") {
      revert.addEventListener("click", () => {
        Options.applyOption([option.id, Options.getDefaultOption(option.id)])
        const callback: ((app: App, value: any) => void) | undefined =
          option.input.onChange
        callback?.(this.app, Options.getDefaultOption(option.id))
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
      label.innerText = option.label
      if (!option.input) return item
      const optionValue = Options.getOption(option.id)
      const newInputOptions = option.input
      const oldCallback: ((app: App, value: any) => void) | undefined =
        newInputOptions.onChange

      newInputOptions.onChange = (app: App, value: any) => {
        Options.applyOption([option.id, value])
        revert.style.display =
          Options.getDefaultOption(option.id) === Options.getOption(option.id)
            ? "none"
            : "block"
        option
        oldCallback?.(app, value)
      }
      const input = createValueInput(this.app, newInputOptions, optionValue)
      if (option.input.type == "checkbox") {
        input.classList.add("pref-input", "right")
      }
      if (option.input.type == "dropdown") {
        input.classList.add("pref-input", "dropdown-right")
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

  onClose(): void {
    this.observer?.disconnect()
  }
}
