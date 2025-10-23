import { useEffect, useState } from "react"
import { App } from "../../../App"
import { KEYBIND_DATA } from "../../../data/KeybindData"
import {
  MENUBAR_DATA,
  MenuCheckbox,
  MenuDropdown,
  MenuMain,
  MenuSelection,
} from "../../../data/MenubarData"
import { Keybinds } from "../../../util/Keybinds"
import { evaluateDynamicProperty } from "./Menubar"

export function SearchBar(props: { app: App }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<
    { path: string[]; option: MenuCheckbox | MenuSelection }[]
  >([])

  function traverseOptions(
    data: MenuDropdown | MenuMain,
    path: string[] = []
  ): { path: string[]; option: MenuCheckbox | MenuSelection }[] {
    let results: {
      path: string[]
      option: MenuCheckbox | MenuSelection
    }[] = []
    for (const option of data.options) {
      switch (option.type) {
        case "dropdown":
        case "menu":
          results = results.concat(
            traverseOptions(option, [
              ...path,
              evaluateDynamicProperty(props.app, option.title),
            ])
          )
          break
        case "selection":
        case "checkbox":
          results.push({
            path: [...path, KEYBIND_DATA[option.id].label],
            option,
          })
          break
        case "separator":
          break
      }
    }
    return results
  }

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const allOptions = Object.values(MENUBAR_DATA)
      .map(v => traverseOptions(v, [v.title]))
      .flat()
    let filtered = allOptions
      .filter(data =>
        data.path.some(part => part.toLowerCase().includes(query.toLowerCase()))
      )
      .filter(data => {
        const keybind = KEYBIND_DATA[data.option.id]
        if (
          keybind.visible !== undefined &&
          !evaluateDynamicProperty(props.app, keybind.visible)
        )
          return false
        return true
      })
    if (filtered.length > 15) {
      filtered = filtered.filter(data => {
        const keybind = KEYBIND_DATA[data.option.id]
        return !evaluateDynamicProperty(props.app, keybind.disabled)
      })
    }
    setResults(filtered.slice(0, 15))
  }, [query, props.app])

  return (
    <div className="menu-search">
      <input
        type="text"
        placeholder="Search the menus..."
        value={query}
        autoFocus
        onChange={e => void setQuery(e.target.value)}
        onClick={e => e.stopPropagation()}
      />
      <div className="menu-search-dropdown">
        {query === "" ? null : results.length === 0 ? (
          <div className="menu-item disabled">
            <div className="menu-title menu-hover">
              <div className="title unselectable">No results found</div>
            </div>
          </div>
        ) : (
          results.map((data, i) => (
            <div className="menu-item" key={i}>
              <div className="menu-title menu-hover">
                <div className="title unselectable">
                  {data.path.join(" > ")}
                </div>
                <div className="keybind unselectable">
                  {Keybinds.getKeybindString(data.option.id)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
