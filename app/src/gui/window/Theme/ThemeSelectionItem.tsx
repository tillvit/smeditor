import {
  DEFAULT_THEMES,
  Theme,
  THEME_GRID_PROPS,
} from "../../../data/ThemeData"
import { Themes } from "../../../util/Theme"
import { InlineTextInput } from "../../inputs/InlineTextInput"

export function ThemeSelectionItem(props: { id: string; theme: Theme }) {
  return (
    <>
      <InlineTextInput
        value={props.id}
        className="theme-title"
        disabled={!!DEFAULT_THEMES[props.id]}
        style={DEFAULT_THEMES[props.id] ? { fontWeight: "bold" } : {}}
        onChange={value => {
          const newName = Themes.getNonConflictingName(value)
          Themes.renameUserTheme(props.id, newName)
          Themes.loadTheme(newName)
        }}
      />
      <div className="theme-preview-grid">
        {THEME_GRID_PROPS.map(prop => (
          <div
            key={prop}
            style={{ backgroundColor: props.theme[prop].toHex() }}
          ></div>
        ))}
      </div>
    </>
  )
}
