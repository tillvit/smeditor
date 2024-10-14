import { App } from "../../App"
import {
  KEYBIND_DATA,
  KEY_DISPLAY_OVERRIDES,
  Modifier,
} from "../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../data/MenubarData"
import { Keybinds } from "../../util/Keybinds"
import { capitalize } from "../../util/Util"
import { Icons } from "../Icons"
import { Dropdown } from "../element/Dropdown"
import { KeyComboWindow } from "./KeyComboWindow"
import { Window } from "./Window"

interface KeybindInserts {
  ids: string[]
  after?: string
}

const KEYBIND_BLACKLIST = ["cut", "copy", "paste", "pasteReplace"]
const KEYBIND_INSERTS: Record<string, KeybindInserts[]> = {
  edit: [
    {
      ids: ["delete"],
      after: "redo",
    },
    {
      ids: [
        "previousNoteType",
        "nextNoteType",
        "noteTypeTap",
        "noteTypeMine",
        "noteTypeFake",
        "noteTypeLift",
        "quant4",
        "quant8",
        "quant12",
        "quant16",
        "quant24",
        "quant32",
        "quant48",
        "quant64",
        "quant96",
        "quant192",
      ],
      after: "mousePlacement",
    },
  ],
  view: [
    {
      ids: ["playback", "selectRegion"],
    },
  ],
  debug: [
    {
      ids: ["showFPSCounter", "showDebugTimers"],
    },
  ],
}

export class KeybindWindow extends Window {
  private static GROUPS: Record<string, string[]>

  app: App
  private observer?: IntersectionObserver
  private searchDropdown?: Dropdown<string>

  private conflictMap = this.calculateConflicts()

  constructor(app: App) {
    super({
      title: "Keybind Options",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "keybind_options",
      blocking: false,
    })
    this.app = app

    if (!KeybindWindow.GROUPS)
      KeybindWindow.GROUPS = KeybindWindow.createGroups()

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
    searchBar.placeholder = "Search for a keybind..."

    searchBar.oninput = () => {
      section.replaceChildren(...this.createSections(searchBar.value))
      option.replaceChildren(...this.createOptions(searchBar.value))
    }

    const searchType = Dropdown.create(["Name", "Key"], "Name")
    searchType.onChange(() => {
      section.replaceChildren(...this.createSections(searchBar.value))
      option.replaceChildren(...this.createOptions(searchBar.value))
    })
    this.searchDropdown = searchType

    search.replaceChildren(searchBar, searchType.view)

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

    container.replaceChildren(search, scrollers)

    section.replaceChildren(...this.createSections())
    option.replaceChildren(...this.createOptions())
    padding.appendChild(container)
    this.viewElement.appendChild(padding)
  }

  private createSections(filter = "") {
    return Object.keys(KeybindWindow.GROUPS)
      .filter(groupID =>
        KeybindWindow.GROUPS[groupID].some(id => this.filterID(filter, id))
      )
      .map(id =>
        this.createEmptySection(MENUBAR_DATA[id]?.title ?? capitalize(id), id)
      )
  }

  private createOptions(filter = "") {
    return Object.keys(KeybindWindow.GROUPS)
      .filter(groupID =>
        KeybindWindow.GROUPS[groupID].some(id => this.filterID(filter, id))
      )
      .map(groupID => {
        const options = KeybindWindow.GROUPS[groupID]
          .filter(id => this.filterID(filter, id))
          .map(id => this.createKeybindItem(id))
        const groupElement = document.createElement("div")
        groupElement.classList.add("pref-group")
        groupElement.dataset.id = groupID

        const label = document.createElement("div")
        label.classList.add("pref-group-label")
        label.innerText = MENUBAR_DATA[groupID]?.title ?? capitalize(groupID)

        groupElement.replaceChildren(label, ...options)
        this.observer!.observe(groupElement)
        return groupElement
      })
  }

  private static createGroups() {
    const missingKeybindTest = Object.keys(KEYBIND_DATA)

    const GROUPS: Record<string, string[]> = {}
    Object.keys(MENUBAR_DATA).forEach(id => {
      GROUPS[id] = this.expandMenubarOptions(MENUBAR_DATA[id])
        .map(option => {
          const idx = missingKeybindTest.indexOf(option)
          if (idx != -1) missingKeybindTest.splice(idx, 1)
          return option
        })
        .filter(option => !KEYBIND_BLACKLIST.includes(option))
    })
    Object.keys(KEYBIND_INSERTS).forEach(id => {
      if (GROUPS[id] === undefined) GROUPS[id] = []
      KEYBIND_INSERTS[id].forEach(insert => {
        const insertIndex = !insert.after
          ? 0
          : (GROUPS[id].findIndex(id => insert.after == id) + 1 ?? 0)
        GROUPS[id].splice(insertIndex, 0, ...insert.ids)
        insert.ids.forEach(option => {
          const idx = missingKeybindTest.indexOf(option)
          if (idx != -1) missingKeybindTest.splice(idx, 1)
        })
      })
    })
    KEYBIND_BLACKLIST.forEach(option => {
      const idx = missingKeybindTest.indexOf(option)
      if (idx != -1) missingKeybindTest.splice(idx, 1)
    })
    if (missingKeybindTest.length > 0) {
      console.warn("Missing keybinds not shown:")
      console.warn(missingKeybindTest)
    }
    return GROUPS
  }

  private filterID(filter: string, id: string) {
    if ((this.searchDropdown?.value ?? "Name") == "Name") {
      return (KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label)
        .toLowerCase()
        .includes(filter.toLowerCase())
    } else {
      const combos = Keybinds.getCombosForKeybind(id)
      if (
        combos.some(combo =>
          combo.key.toLowerCase().includes(filter.toLowerCase())
        )
      )
        return true
      if (
        combos.some(combo =>
          (KEY_DISPLAY_OVERRIDES[combo.key] ?? combo.key)
            .toLowerCase()
            .includes(filter.toLowerCase())
        )
      )
        return true
      let keys = filter.split(" ").map(key => key.toLowerCase())
      return combos.some(combo => {
        if (
          (keys.includes("shift") || keys.includes("⇧")) &&
          !combo.mods.includes(Modifier.SHIFT)
        )
          return false
        if (
          (keys.includes("ctrl") ||
            keys.includes("control") ||
            keys.includes("⌃")) &&
          !combo.mods.includes(Modifier.CTRL)
        )
          return false
        if (
          (keys.includes("meta") ||
            keys.includes("cmd") ||
            keys.includes("command") ||
            keys.includes("⌘")) &&
          !combo.mods.includes(Modifier.META)
        )
          return false
        if (
          (keys.includes("alt") || keys.includes("⌥")) &&
          !combo.mods.includes(Modifier.ALT)
        )
          return false

        // filter out modifiers
        keys = keys.filter(
          key =>
            ![
              "shift",
              "ctrl",
              "control",
              "meta",
              "cmd",
              "command",
              "alt",
              "⇧",
              "⌃",
              "⌘",
              "⌥",
              "",
            ].includes(key)
        )
        return (
          keys.length == 0 ||
          (keys.length == 1 && combo.key.toLowerCase().includes(keys[0]))
        )
      })
    }
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
      case "separator":
        return []
    }
  }

  private createEmptySection(label: string, id: string) {
    const sectionElement = document.createElement("div")
    sectionElement.classList.add("pref-section")
    sectionElement.dataset.id = id
    sectionElement.innerText = label

    sectionElement.onclick = () => {
      sectionElement
        .parentElement!.parentElement!.querySelector(
          `.pref-group[data-id=${id}]`
        )!
        .scrollIntoView()
    }

    return sectionElement
  }

  private createKeybindItem(id: string) {
    const keybindElement = document.createElement("div")
    keybindElement.classList.add("pref-keybind")
    keybindElement.dataset.id = id

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
          true,
          combo => {
            Keybinds.setKeybind(id, combo)
            this.conflictMap = this.calculateConflicts()
            keybindElement.replaceWith(this.createKeybindItem(id))
          },
          combo => {
            const conflicts =
              this.conflictMap
                .get(Keybinds.getComboString(combo))
                ?.map(data => data[0])
                .map(
                  id => KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label
                ) ?? []
            if (conflicts.includes(id)) return "self"
            return conflicts
          }
        )
      )
    }

    const label = document.createElement("div")
    label.classList.add("pref-keybind-label")
    label.innerText = KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label

    const revert = Icons.getIcon("REVERT")
    revert.style.width = "12px"
    revert.addEventListener("click", () => {
      Keybinds.revertKeybind(id)
      this.conflictMap = this.calculateConflicts()
      keybindElement.replaceWith(this.createKeybindItem(id))
    })
    revert.style.display = Keybinds.checkIsDefault(id) ? "none" : "block"

    const combos = document.createElement("div")
    combos.classList.add("pref-keybind-combos")

    combos.replaceChildren(
      ...Keybinds.getCombosForKeybind(id).map(combo => {
        const comboElement = document.createElement("button")
        comboElement.classList.add("pref-keybind-combo")
        comboElement.innerText = Keybinds.getComboString(combo)
        if (this.conflictMap.get(Keybinds.getComboString(combo))!.length > 1)
          comboElement.classList.add("conflict")
        comboElement.onclick = () => {
          Keybinds.removeKeybind(id, combo)
          this.conflictMap = this.calculateConflicts()
          keybindElement.replaceWith(this.createKeybindItem(id))
        }
        return comboElement
      })
    )

    keybindElement.replaceChildren(label, revert, combos)

    return keybindElement
  }

  private calculateConflicts() {
    const conflicts = new Map<string, [string, number][]>()
    Object.keys(KEYBIND_DATA).forEach(keybindID => {
      Keybinds.getCombosForKeybind(keybindID).forEach((combo, index) => {
        const comboString = Keybinds.getComboString(combo)
        if (!conflicts.has(comboString)) conflicts.set(comboString, [])
        conflicts.get(comboString)!.push([keybindID, index])
      })
    })
    ;[
      ...this.viewElement.querySelectorAll(`.pref-keybind-combo.conflict`),
    ].forEach(element => element.classList.remove("conflict"))
    for (const binds of conflicts.values()) {
      if (binds.length == 1) continue
      binds.forEach(bind => {
        const row = this.viewElement.querySelector(
          `.pref-keybind[data-id=${bind[0]}] .pref-keybind-combos`
        )
        if (row?.children[bind[1]]) {
          row.children[bind[1]].classList.add("conflict")
        }
      })
    }
    return conflicts
  }

  onClose(): void {
    this.observer?.disconnect()
  }
}
