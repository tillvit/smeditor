import { Color } from "pixi.js"
import { useContext, useState } from "react"
import {
  Theme,
  THEME_GENERATOR_LINKS,
  THEME_GROUPS,
  ThemeProperty,
} from "../../../data/ThemeData"
import { Options } from "../../../util/Options"
import { Themes } from "../../../util/Theme"
import { WindowContext, WindowData, WindowManager } from "../WindowManager"
import { ThemeEditorGroup } from "./ThemeEditorGroup"
import { ThemeSelectionWindow } from "./ThemeSelectionWindow"

export function ThemeEditorWindowContent() {
  const windowData = useContext(WindowContext)
  const [currentTheme, setCurrentTheme] = useState(Themes.getCurrentTheme())
  const [linkBlacklist, setLinkBlacklist] = useState<Record<string, boolean>>(
    {}
  )
  const [hovered, setHovered] = useState<ThemeProperty | null>(null)

  function updateLinks(updatedId: ThemeProperty, theme: Theme) {
    const visited = new Set<string>()
    const queue: ThemeProperty[] = [updatedId]
    while (queue.length != 0) {
      const currentId = queue.shift()!
      const links = THEME_GENERATOR_LINKS[currentId]
      if (!links) continue
      for (const [id, transform] of Object.entries(links)) {
        if (linkBlacklist[id]) continue
        if (visited.has(id)) continue
        theme[id as ThemeProperty] = transform(theme[currentId])
        queue.push(id as ThemeProperty)
        visited.add(id)
      }
    }
    return theme
  }

  function onChange(id: ThemeProperty, color: Color) {
    console.log(id, color)
    const newTheme = Themes.getCurrentTheme()
    newTheme[id] = color
    const updatedTheme = updateLinks(id, newTheme)
    Themes._applyTheme(updatedTheme)
    setCurrentTheme({ ...updatedTheme })
  }

  return (
    <div className="flex-column-full">
      <div className="theme-color-grid">
        {THEME_GROUPS.map((group, i) => (
          <ThemeEditorGroup
            key={i}
            group={group}
            theme={currentTheme}
            linkBlacklist={linkBlacklist}
            setLinkedBlacklist={setLinkBlacklist}
            onChange={onChange}
            hovered={hovered}
            setHovered={setHovered}
          />
        ))}
      </div>
      <div className="menu-options">
        <div className="menu-left">
          <button
            onClick={() => {
              windowData?.close()
              Themes.loadTheme(Options.general.theme)
              WindowManager.openWindow(ThemeSelectionWindow())
            }}
          >
            Cancel
          </button>
        </div>
        <div className="menu-right">
          <button
            className="confirm"
            onClick={() => {
              Themes.setUserTheme(
                Options.general.theme,
                Themes.getCurrentTheme()
              )
              Themes.loadTheme(Options.general.theme)
              WindowManager.openWindow(ThemeSelectionWindow())
              windowData?.close()
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function ThemeEditorWindow(): WindowData {
  return {
    title: "Theme Color Editor",
    width: 500,
    height: 400,
    id: "theme-editor",
    disableClose: true,
    content: <ThemeEditorWindowContent />,
  }
}
