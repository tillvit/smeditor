import { useEffect, useState } from "react"
import { App } from "../../App"
import { KEYBIND_DATA } from "../../data/KeybindData"
import {
  MENUBAR_DATA,
  MenuCheckbox,
  MenuDropdown,
  MenuMain,
  MenuOption,
  MenuSelection,
} from "../../data/MenubarData"
import { Flags } from "../../util/Flags"
import { Keybinds } from "../../util/Keybinds"
import { ReactIcon } from "../Icons"

interface MenubarProps<T extends MenuOption = MenuOption> {
  app: App
  id: string
  data: T
  parentActive: string | null
  setActive: (key: string | null) => void
  close: () => void
}

function evaluateDynamicProperty<T extends string | number | boolean>(
  app: App,
  property: T | ((app: App) => T)
) {
  if (typeof property === "function") {
    return property(app)
  }
  return property
}

function SearchBar(props: { app: App }) {
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

function MenubarSelection(props: MenubarProps<MenuSelection | MenuCheckbox>) {
  const meta = KEYBIND_DATA[props.data.id] ?? {
    label: props.data.id,
    combos: [],
    callback: () => {},
  }
  const visible =
    meta.visible === undefined ||
    evaluateDynamicProperty(props.app, meta.visible)
  const disabled = evaluateDynamicProperty(props.app, meta.disabled)
  if (!visible) return <></>

  const checked =
    props.data.type == "checkbox" &&
    evaluateDynamicProperty(props.app, props.data.checked)

  return (
    <div
      className={
        "menu-item" +
        (disabled ? " disabled" : "") +
        (props.parentActive == props.id ? " selected" : "")
      }
      onClick={event => {
        event.stopPropagation()
        if (disabled) return
        meta?.callback(props.app)
        props.close()
      }}
      onMouseEnter={() => props.setActive(props.id)}
    >
      <div className="menu-title">
        <span className="title unselectable">
          {checked && "✓ "}
          {meta.label}
        </span>
        <span className="keybind unselectable">
          {Keybinds.getKeybindString(props.data.id)}
        </span>
      </div>
    </div>
  )
}

function MenubarDropdown(props: MenubarProps<MenuDropdown | MenuMain>) {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const title =
    typeof props.data.title === "function"
      ? props.data.title(props.app)
      : props.data.title
  return (
    <div
      className={
        "menu-item" +
        (props.data.type == "menu" ? " menu-main" : "") +
        (props.parentActive == props.id ? " selected" : "")
      }
      onClick={event => {
        event.stopPropagation()
        if (props.parentActive == props.id && props.data.type == "menu") {
          props.setActive(null)
          return
        }
        props.setActive(props.id)
      }}
      onMouseEnter={() => {
        if (props.data.type == "menu") {
          if (props.parentActive != null) {
            props.setActive(props.id)
          }
          return
        }
        props.setActive(props.id)
      }}
    >
      <div className="menu-title">
        <span className="title unselectable">{title}</span>
        {props.data.type == "dropdown" && (
          <ReactIcon
            id="CHEVRON"
            width={16}
            height={16}
            color="var(--text-color)"
            style={{ transform: "rotate(-90deg)" }}
          />
        )}
      </div>
      {props.parentActive == props.id && (
        <div className="menubar-dropdown">
          {props.data.type == "menu" && props.data.title == "Help" && (
            <SearchBar app={props.app} />
          )}
          {props.data.options.map((option, i) => {
            const newProps = {
              app: props.app,
              id: props.id + "-" + i,
              parentActive: activeItem,
              setActive: setActiveItem,
              close: () => {
                props.close()
              },
            }
            switch (option.type) {
              case "separator":
                return (
                  <div
                    className="separator"
                    key={i}
                    onClick={event => event.stopPropagation()}
                  />
                )
              case "selection":
              case "checkbox":
                return <MenubarSelection key={i} {...newProps} data={option} />
              case "dropdown":
              case "menu":
                return <MenubarDropdown key={i} {...newProps} data={option} />
            }
          })}
        </div>
      )}
    </div>
  )
}

export function Menubar(props: { app: App }): React.JSX.Element {
  if (!Flags.menuBar) return <></>

  const [activeItem, setActiveItem] = useState<string | null>(null)

  useEffect(() => {
    const menubar = document.getElementById("menubar")
    const clickOutside = (event: MouseEvent) => {
      if (!menubar!.contains(event.target as Node)) {
        setActiveItem(null)
      }
    }
    document.addEventListener("pointerdown", clickOutside)
    return () => {
      document.removeEventListener("pointerdown", clickOutside)
    }
  }, [])

  return (
    <div id="menubar">
      {Object.entries(MENUBAR_DATA).map(([key, data]) => {
        return (
          <MenubarDropdown
            key={key}
            id={key}
            app={props.app}
            data={data}
            parentActive={activeItem}
            setActive={setActiveItem}
            close={() => {
              setActiveItem(null)
            }}
          />
        )
      })}
    </div>
  )
}
