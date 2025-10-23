import { MouseEvent, useEffect, useState } from "react"
import { GAMEPLAY_KEYBINDS } from "../../../data/GameplayKeybindData"
import { EventHandler } from "../../../util/EventHandler"
import { Keybinds } from "../../../util/Keybinds"
import { ReactIcon } from "../../Icons"
import { WindowManager } from "../WindowManager"
import { GameplayKeybindItem } from "./GameplayKeybindWindow"
import { KeyComboWindow } from "./KeyComboWindow"

export function GameplayKeybindItemComponent(props: {
  item: GameplayKeybindItem
}) {
  const [isDefault, setIsDefault] = useState(
    Keybinds.checkIsDefaultGameplay(props.item.id, props.item.index)
  )
  const [keys, setKeys] = useState(
    Keybinds.getKeysForGameType(props.item.id)[props.item.index]
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
        allowMods: false,
        callback: combo => {
          Keybinds.setGameplayKeybind(
            props.item.id,
            props.item.index,
            combo.key
          )
        },
        conflictCheck: combo => {
          const conflicts = Keybinds.getGameplayConflicts(
            combo.key,
            props.item.id
          )
          if (conflicts.includes(props.item.index)) return "self"
          return conflicts.map(
            index =>
              GAMEPLAY_KEYBINDS[props.item.id]?.[index].label ??
              "Column " + index
          )
        },
      })
    )
  }

  useEffect(() => {
    const handleKeybindChange = () => {
      setIsDefault(
        Keybinds.checkIsDefaultGameplay(props.item.id, props.item.index)
      )
      setKeys([...Keybinds.getKeysForGameType(props.item.id)[props.item.index]])
    }
    EventHandler.on("gameplayKeybindChanged", handleKeybindChange)
    return () => {
      EventHandler.off("gameplayKeybindChanged", handleKeybindChange)
    }
  }, [props.item.id, props.item.index])

  return (
    <div className="pref-keybind" onClick={handleClick}>
      <div className="pref-keybind-label">{props.item.label}</div>
      <ReactIcon
        id="REVERT"
        width={12}
        height={12}
        style={{ display: isDefault ? "none" : "" }}
        onClick={() => {
          Keybinds.revertGameplayKeybind(props.item.id, props.item.index)
        }}
      />
      <div className="pref-keybind-combos">
        {keys.map(key => {
          const conflicts =
            Keybinds.getGameplayConflicts(key, props.item.id).length > 1
          return (
            <button
              key={key}
              className={`pref-keybind-combo${conflicts ? " conflict" : ""}`}
              onClick={e => {
                e.stopPropagation()
                Keybinds.removeGameplayKeybind(
                  props.item.id,
                  props.item.index,
                  key
                )
              }}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
