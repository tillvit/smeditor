import { Color } from "pixi.js"
import { Dispatch, SetStateAction } from "react"
import { Theme, ThemeGroup, ThemeProperty } from "../../../data/ThemeData"
import { ThemeColorPicker } from "./ThemeColorPicker"

export function ThemeEditorGroup(props: {
  theme: Theme
  group: ThemeGroup
  linkBlacklist: Record<string, boolean>
  setLinkedBlacklist: Dispatch<SetStateAction<Record<string, boolean>>>
  onChange: (id: ThemeProperty, color: Color) => void
  hovered: ThemeProperty | null
  setHovered: Dispatch<SetStateAction<ThemeProperty | null>>
}) {
  return (
    <div className="theme-group">
      <div className="theme-group-label">{props.group.name}</div>
      <div className="theme-picker-grid">
        {props.group.ids.map(i => (
          <ThemeColorPicker
            key={i.id}
            id={i.id}
            label={i.label}
            linkBlacklist={props.linkBlacklist}
            setLinkedBlacklist={props.setLinkedBlacklist}
            hovered={props.hovered}
            setHovered={props.setHovered}
            color={props.theme[i.id]}
            onChange={c => {
              props.onChange(i.id, c)
            }}
          />
        ))}
      </div>
    </div>
  )
}
