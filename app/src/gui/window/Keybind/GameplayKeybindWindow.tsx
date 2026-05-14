import { useMemo } from "react"
import { GameTypeRegistry } from "../../../chart/gameTypes/GameTypeRegistry"
import { GAMEPLAY_KEYBINDS } from "../../../data/GameplayKeybindData"
import {
  OptionData,
  OptionItem,
  OptionViewer,
} from "../UserOptions/OptionViewer"
import { WindowData } from "../WindowManager"
import { GameplayKeybindItemComponent } from "./GameplayKeybindItemComponent"

export interface GameplayKeybindItem extends OptionItem {
  index: number
  id: string
  label: string
}

function createGroups(): OptionData<GameplayKeybindItem>[] {
  return Object.keys(GameTypeRegistry.getTypes()).map(id => {
    return {
      type: "group",
      id: id,
      label: id,
      children: new Array(GameTypeRegistry.getTypes()[id].numCols)
        .fill(null)
        .map((_, index) => {
          return {
            type: "item",
            index,
            id: id,
            label: GAMEPLAY_KEYBINDS[id]?.[index].label ?? "Column " + index,
          }
        }),
    }
  })
}

function GameplayKeybindWindowContent() {
  const availableBinds = useMemo(() => createGroups(), [])
  return (
    <div className="flex-column-full" style={{ gap: "0.6rem" }}>
      <OptionViewer
        options={availableBinds}
        itemElement={GameplayKeybindItemComponent}
      />
    </div>
  )
}

export function GameplayKeybindWindow(): WindowData {
  return {
    title: "Gameplay Keybind Options",
    width: 600,
    height: 400,
    id: "gameplay-keybind-options",
    content: <GameplayKeybindWindowContent />,
  }
}
