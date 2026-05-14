import { MouseEvent, useEffect, useState } from "react"
import { KEYBIND_DATA } from "../../../data/KeybindData"
import { EventHandler } from "../../../util/EventHandler"
import { Keybinds } from "../../../util/Keybinds"
import { ReactIcon } from "../../Icons"
import { WindowManager } from "../WindowManager"
import { KeybindItem } from "./KeybindWindow"
import { KeyComboWindow } from "./KeyComboWindow"

export function KeybindItemComponent(props: { item: KeybindItem }) {
  const [isDefault, setIsDefault] = useState(
    Keybinds.checkIsDefault(props.item.id)
  )
  const [combos, setCombos] = useState(
    Keybinds.getCombosForKeybind(props.item.id)
  )

  function handleClick(event: MouseEvent) {
    if (
      (event.target as HTMLElement).classList.contains("pref-keybind-combo") ||
      event.currentTarget
        .querySelector(".icon")
        ?.contains(event.target as HTMLElement)
    )
      return
    WindowManager.openWindow(
      KeyComboWindow({
        allowMods: true,
        callback: combo => {
          Keybinds.setKeybind(props.item.id, combo)
        },
        conflictCheck: combo => {
          const conflicts = Keybinds.getConflicts(combo).map(data => data[0])
          if (conflicts.includes(props.item.id)) return "self"
          return conflicts.map(
            id => KEYBIND_DATA[id].bindLabel ?? KEYBIND_DATA[id].label
          )
        },
      })
    )
  }

  useEffect(() => {
    const handleKeybindChange = () => {
      setIsDefault(Keybinds.checkIsDefault(props.item.id))
      setCombos([...Keybinds.getCombosForKeybind(props.item.id)])
    }
    EventHandler.on("keybindChanged", handleKeybindChange)
    return () => {
      EventHandler.off("keybindChanged", handleKeybindChange)
    }
  }, [props.item.id])

  return (
    <div className="pref-keybind" onClick={handleClick}>
      <div className="pref-keybind-label">{props.item.label}</div>
      <ReactIcon
        id="REVERT"
        width={12}
        height={12}
        style={{ display: isDefault ? "none" : "" }}
        onClick={() => {
          Keybinds.revertKeybind(props.item.id)
        }}
      />
      <div className="pref-keybind-combos">
        {combos.map(combo => {
          const conflicts = Keybinds.getConflicts(combo).length > 1
          return (
            <button
              key={Keybinds.getComboString(combo)}
              className={`pref-keybind-combo${conflicts ? " conflict" : ""}`}
              onClick={e => {
                e.stopPropagation()
                Keybinds.removeKeybind(props.item.id, combo)
              }}
            >
              {Keybinds.getComboString(combo)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
