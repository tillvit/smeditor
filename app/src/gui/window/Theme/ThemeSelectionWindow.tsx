import { useEffect, useRef, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { Themes } from "../../../util/Theme"
import { WindowData } from "../WindowManager"
import { ThemeSelectionItem } from "./ThemeSelectionItem"
import { ThemeTray } from "./ThemeTray"

function ThemeSelectionWindowContent() {
  const [query, setQuery] = useState("")
  const [selectedTheme, setSelectedTheme] = useState(Options.general.theme)
  const shouldScroll = useRef(true)
  const [themes, setThemes] = useState(Themes.getThemes())

  useEffect(() => {
    const handleThemeChange = () => {
      setThemes(Themes.getThemes())
      setSelectedTheme(Options.general.theme)
    }
    EventHandler.on("themeChanged", handleThemeChange)
    return () => {
      EventHandler.off("themeChanged", handleThemeChange)
    }
  }, [])

  function containsQuery(query: string, string: string | undefined) {
    if (!string) return false
    return string.toLowerCase().includes(query.trim().toLowerCase())
  }

  return (
    <div className="flex-column-full">
      <input
        className="pref-search-bar"
        type="text"
        placeholder="Search for a theme..."
        value={query}
        onChange={e => {
          setQuery(e.target.value)
        }}
      />
      <div className="theme-grid">
        {Object.entries(themes)
          .filter(([id]) => containsQuery(query, id))
          .map(([id, theme]) => {
            return (
              <div
                key={id}
                className={
                  "theme-cell " + (id == selectedTheme ? "selected" : "")
                }
                onClick={() => {
                  if (Options.general.theme == id) return
                  Themes.loadTheme(id)
                  setSelectedTheme(id)
                }}
                ref={el => {
                  if (el && id == selectedTheme && shouldScroll.current) {
                    el.scrollIntoView({
                      behavior: Options.general.smoothAnimations
                        ? "smooth"
                        : "instant",
                      block: "center",
                    })
                    shouldScroll.current = false
                  }
                }}
              >
                <ThemeSelectionItem id={id} theme={theme} />
              </div>
            )
          })}
      </div>
      <ThemeTray selectedTheme={selectedTheme} />
    </div>
  )
}

export function ThemeSelectionWindow(): WindowData {
  return {
    title: "Themes",
    width: 600,
    height: 400,
    id: "theme-selection",
    content: <ThemeSelectionWindowContent />,
  }
}
