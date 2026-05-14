import { useEffect, useMemo, useState } from "react"
import {
  KEYBIND_DATA,
  KEY_DISPLAY_OVERRIDES,
  Modifier,
} from "../../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../../data/MenubarData"
import { Keybinds } from "../../../util/Keybinds"
import { capitalize } from "../../../util/Util"
import { DropdownInput } from "../../inputs/DropdownInput"
import {
  OptionData,
  OptionGroup,
  OptionItem,
  OptionViewer,
} from "../UserOptions/OptionViewer"
import { WindowData } from "../WindowManager"
import { KeybindItemComponent } from "./KeybindItemComponent"

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
        "toggleEditTiming",
        "toggleAddTiming",
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

function expandMenubarOptions(option: MenuOption): string[] {
  switch (option.type) {
    case "menu":
    case "dropdown":
      return option.options.map(item => expandMenubarOptions(item)).flat()
    case "selection":
    case "checkbox":
      return [option.id]
    case "separator":
      return []
  }
}

export interface KeybindItem extends OptionItem {
  id: string
  label: string
}

function createGroups(): OptionData<KeybindItem>[] {
  const missingKeybindTest = Object.keys(KEYBIND_DATA)

  const GROUPS: OptionGroup<KeybindItem>[] = []
  Object.keys(MENUBAR_DATA).forEach(id => {
    GROUPS.push({
      type: "group",
      id: id,
      label: MENUBAR_DATA[id]?.title ?? capitalize(id),
      children: expandMenubarOptions(MENUBAR_DATA[id])
        .map(option => {
          const idx = missingKeybindTest.indexOf(option)
          if (idx != -1) missingKeybindTest.splice(idx, 1)
          return option
        })
        .filter(option => !KEYBIND_BLACKLIST.includes(option))
        .map(id => ({
          type: "item",
          id: id,
          label: KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label,
        })),
    })
  })
  Object.keys(KEYBIND_INSERTS).forEach(id => {
    if (!GROUPS.some(group => group.id === id))
      GROUPS.push({ id, children: [], type: "group", label: capitalize(id) })
    const group = GROUPS.find(group => group.id === id)!
    KEYBIND_INSERTS[id].forEach(insert => {
      let insertIndex = 0
      if (insert.after) {
        const pos =
          group.children.findIndex(
            item => insert.after == (item as KeybindItem).id
          ) + 1
        if (pos != 0) insertIndex = pos
      }
      group.children.splice(
        insertIndex,
        0,
        ...insert.ids.map(
          id =>
            ({
              type: "item",
              id,
              label: KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label,
            }) as KeybindItem
        )
      )
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

function KeybindWindowContent() {
  const [query, setQuery] = useState("")
  const [queryType, setQueryType] = useState<"Name" | "Key">("Name")
  const availableBinds = useMemo(() => createGroups(), [])
  const [binds, setBinds] = useState(availableBinds)

  function matchesQuery(item: KeybindItem) {
    if (queryType == "Name") {
      return item.label.toLowerCase().includes(query.toLowerCase())
    } else {
      const combos = Keybinds.getCombosForKeybind(item.id)
      if (
        combos.some(combo =>
          combo.key.toLowerCase().includes(query.toLowerCase())
        )
      )
        return true
      if (
        combos.some(combo =>
          (KEY_DISPLAY_OVERRIDES[combo.key] ?? combo.key)
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      )
        return true
      let keys = query.split(" ").map(key => key.toLowerCase())
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

  function filterBinds(options: OptionData<KeybindItem>[] = availableBinds) {
    const filteredOptions: OptionData<KeybindItem>[] = []
    options.forEach(option => {
      if (option.type == "group" || option.type == "subgroup") {
        if (
          queryType == "Name" &&
          option.label?.toLowerCase().includes(query.toLowerCase())
        ) {
          filteredOptions.push(option)
          return
        }
        const filteredChildren = filterBinds(option.children)
        if (filteredChildren.length != 0)
          filteredOptions.push({ ...option, children: filteredChildren })
      } else {
        if (matchesQuery(option)) filteredOptions.push(option)
      }
    })
    return filteredOptions
  }

  useEffect(() => {
    setBinds(filterBinds())
  }, [query])

  return (
    <div className="flex-column-full" style={{ gap: "0.6rem" }}>
      <div className="pref-search">
        <input
          className="pref-search-bar"
          type="text"
          placeholder="Search for a keybind..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
          }}
          style={{ flex: "1" }}
        />
        <DropdownInput
          value={queryType}
          onChange={value => setQueryType(value as "Name" | "Key")}
          values={["Name", "Key"]}
        />
      </div>
      <OptionViewer options={binds} itemElement={KeybindItemComponent} />
    </div>
  )
}

export function KeybindWindow(): WindowData {
  return {
    title: "Keybind Options",
    width: 600,
    height: 400,
    id: "keybind-options",
    content: <KeybindWindowContent />,
  }
}
