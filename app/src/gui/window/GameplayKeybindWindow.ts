import { App } from "../../App"
import { GameTypeRegistry } from "../../chart/gameTypes/GameTypeRegistry"
import { GAMEPLAY_KEYBINDS } from "../../data/GameplayKeybindData"
import { Keybinds } from "../../util/Keybinds"
import { Icons } from "../Icons"
import { KeyComboWindow } from "./KeyComboWindow"
import { Window } from "./Window"

export class GameplayKeybindWindow extends Window {
  app: App
  private observer?: IntersectionObserver

  private conflictMap = this.calculateConflicts()

  constructor(app: App) {
    super({
      title: "Gameplay Keybind Options",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "gameplay_keybind_options",
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

    const scrollers = document.createElement("div")
    scrollers.classList.add("pref-scrollers")

    const section = document.createElement("div")
    section.classList.add("pref-section-scroller")

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

    container.replaceChildren(scrollers)

    section.replaceChildren(...this.createSections())
    option.replaceChildren(...this.createOptions())
    padding.appendChild(container)
    this.viewElement.appendChild(padding)
  }

  private createSections() {
    return Object.keys(GameTypeRegistry.getTypes()).map(id =>
      this.createEmptySection(id)
    )
  }

  private createOptions() {
    return Object.keys(GameTypeRegistry.getTypes()).map(id => {
      const cols = new Array(GameTypeRegistry.getTypes()[id].numCols)
        .fill(null)
        .map((_, index) => this.createKeybindItem(id, index))
      const groupElement = document.createElement("div")
      groupElement.classList.add("pref-group")
      groupElement.dataset.id = id

      const label = document.createElement("div")
      label.classList.add("pref-group-label")
      label.innerText = id

      groupElement.replaceChildren(label, ...cols)
      this.observer!.observe(groupElement)
      return groupElement
    })
  }

  private createEmptySection(id: string) {
    const sectionElement = document.createElement("div")
    sectionElement.classList.add("pref-section")
    sectionElement.dataset.id = id
    sectionElement.innerText = id

    sectionElement.onclick = () => {
      sectionElement
        .parentElement!.parentElement!.querySelector(
          `.pref-group[data-id=${id}]`
        )!
        .scrollIntoView()
    }

    return sectionElement
  }

  private createKeybindItem(id: string, col: number) {
    const keybindElement = document.createElement("div")
    keybindElement.classList.add("pref-keybind")
    keybindElement.dataset.id = id + "-" + col

    keybindElement.onclick = event => {
      if (
        (event.target as HTMLElement).classList.contains(
          "pref-keybind-combo"
        ) ||
        keybindElement
          .querySelector(".icon")
          ?.contains(event.target as HTMLElement)
      )
        return
      this.app.windowManager.openWindow(
        new KeyComboWindow(
          this.app,
          false,
          combo => {
            Keybinds.setGameplayKeybind(id, col, combo.key)
            this.conflictMap = this.calculateConflicts()
            keybindElement.replaceWith(this.createKeybindItem(id, col))
          },
          combo => {
            const conflicts =
              this.conflictMap
                .get(id)
                ?.get(combo.key)
                ?.map(
                  data =>
                    GAMEPLAY_KEYBINDS[data[0]]?.[data[1]].label ??
                    "Column " + data[1]
                ) ?? []
            if (
              conflicts.includes(
                GAMEPLAY_KEYBINDS[id]?.[col].label ?? "Column " + col
              )
            )
              return "self"
            return conflicts
          }
        )
      )
    }

    const label = document.createElement("div")
    label.classList.add("pref-keybind-label")
    label.innerText = GAMEPLAY_KEYBINDS[id]?.[col].label ?? "Column " + col

    const revert = Icons.getIcon("REVERT")
    revert.style.width = "12px"
    revert.addEventListener("click", () => {
      Keybinds.revertGameplayKeybind(id, col)
      this.conflictMap = this.calculateConflicts()
      keybindElement.replaceWith(this.createKeybindItem(id, col))
    })
    revert.style.display = Keybinds.checkIsDefaultGameplay(id, col)
      ? "none"
      : "block"

    const combos = document.createElement("div")
    combos.classList.add("pref-keybind-combos")

    combos.replaceChildren(
      ...Keybinds.getKeysForGameType(id)[col].map(key => {
        const comboElement = document.createElement("button")
        comboElement.classList.add("pref-keybind-combo")
        comboElement.innerText = key
        if (this.conflictMap.get(id)!.get(key)!.length > 1)
          comboElement.classList.add("conflict")
        comboElement.onclick = () => {
          Keybinds.removeGameplayKeybind(id, col, key)
          this.conflictMap = this.calculateConflicts()
          keybindElement.replaceWith(this.createKeybindItem(id, col))
        }
        return comboElement
      })
    )

    keybindElement.replaceChildren(label, revert, combos)

    return keybindElement
  }

  private calculateConflicts() {
    const conflicts = new Map<string, Map<string, [string, number, number][]>>()
    Object.keys(GameTypeRegistry.getTypes()).forEach(id => {
      const map = new Map<string, [string, number, number][]>()
      Keybinds.getKeysForGameType(id).forEach((keys, col) => {
        keys.forEach((key, index) => {
          if (!map.has(key)) map.set(key, [])
          map.get(key)!.push([id, col, index])
        })
      })
      conflicts.set(id, map)
    })
    ;[
      ...this.viewElement.querySelectorAll(`.pref-keybind-combo.conflict`),
    ].forEach(element => element.classList.remove("conflict"))
    for (const map of conflicts.values()) {
      for (const binds of map.values()) {
        if (binds.length == 1) continue
        binds.forEach(bind => {
          const row = this.viewElement.querySelector(
            `.pref-keybind[data-id=${bind[0]}-${bind[1]}] .pref-keybind-combos`
          )
          if (row?.children[bind[2]]) {
            row.children[bind[2]].classList.add("conflict")
          }
        })
      }
    }
    return conflicts
  }

  onClose(): void {
    this.observer?.disconnect()
  }
}
