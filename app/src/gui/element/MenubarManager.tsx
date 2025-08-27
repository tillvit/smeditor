import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
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

interface MenubarProps {
  app: App
  id: string
  data: MenuOption
  parentActive: string | null
  setActive: (key: string | null) => void
  close: () => void
}

function SearchBar(props: { app: App }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<
    { path: string[]; option: MenuCheckbox | MenuSelection }[]
  >([])

  function evaluateDynamicProperty<T extends string | number | boolean>(
    property: T | ((app: App) => T)
  ) {
    if (typeof property === "function") {
      return property(props.app)
    }
    return property
  }

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
              evaluateDynamicProperty(option.title),
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
          !evaluateDynamicProperty(keybind.visible)
        )
          return false
        return true
      })
    if (filtered.length > 15) {
      filtered = filtered.filter(data => {
        const keybind = KEYBIND_DATA[data.option.id]
        return !evaluateDynamicProperty(keybind.disabled)
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
        onChange={e => setQuery(e.target.value)}
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

function MenubarItem(props: MenubarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  function getItemData(app: App, option: MenuOption) {
    switch (option.type) {
      case "selection":
      case "checkbox": {
        const meta = KEYBIND_DATA[option.id] ?? {
          label: option.id,
          combos: [],
          callback: () => {},
        }
        const visible =
          meta.visible === undefined ||
          (typeof meta.visible === "function"
            ? meta.visible(app)
            : meta.visible)
        const disabled =
          typeof meta.disabled === "function"
            ? meta.disabled(app)
            : meta.disabled
        return {
          title: meta.label,
          visible,
          disabled,
        }
      }
      case "menu": {
        return {
          title: option.title,
          visible: true,
          disabled: false,
        }
      }
      case "dropdown": {
        if (typeof option.title == "function") {
          return {
            title: option.title(app),
            visible: true,
            disabled: false,
          }
        }
        return {
          title: option.title,
          visible: true,
          disabled: false,
        }
      }
      case "separator": {
        return {
          title: "",
          visible: true,
          disabled: false,
        }
      }
    }
  }

  function isChecked() {
    if (props.data.type != "checkbox") return false
    let checked = props.data.checked
    if (typeof checked == "function") checked = checked(props.app)
    return checked
  }

  const data = getItemData(props.app, props.data)
  if (!data.visible) return <></>

  if (props.data.type == "separator") {
    return (
      <div className="separator" onClick={event => event.stopPropagation()} />
    )
  }

  return (
    <div
      className={
        "menu-item" +
        (props.data.type == "menu" ? " menu-main" : "") +
        (data.disabled ? " disabled" : "") +
        (props.parentActive == props.id ? " selected" : "")
      }
      onClick={event => {
        event.stopPropagation()
        if (data.disabled) return
        if (props.data.type == "menu") {
          if (props.parentActive == props.id) {
            props.setActive(null)
            return
          }
          props.setActive(props.id)
        }
        if (props.data.type != "selection" && props.data.type != "checkbox")
          return
        const meta = KEYBIND_DATA[props.data.id]
        meta?.callback(props.app)
        props.close()
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
        <span className="title unselectable">
          {props.data.type == "checkbox" && isChecked() && "✓ "}
          {data.title}
        </span>
        {(props.data.type == "selection" || props.data.type == "checkbox") && (
          <span className="keybind unselectable">
            {Keybinds.getKeybindString(props.data.id)}
          </span>
        )}
        {props.data.type == "dropdown" && (
          <ReactIcon
            id="CHEVRON"
            width={16}
            height={16}
            color="var(--text-color)"
            style="transform: rotate(-90deg);"
          />
        )}
      </div>
      {(props.data.type == "dropdown" || props.data.type == "menu") &&
        props.parentActive == props.id && (
          <div className="menubar-dropdown">
            {props.data.type == "menu" && data.title == "Help" && (
              <SearchBar app={props.app} />
            )}
            {props.data.options.map((option, i) => {
              return (
                <MenubarItem
                  key={i}
                  app={props.app}
                  id={props.id + "-" + i}
                  data={option}
                  parentActive={activeItem}
                  setActive={setActiveItem}
                  close={() => {
                    props.close()
                  }}
                />
              )
            })}
          </div>
        )}
    </div>
  )
}

function Menubar(props: { app: App }): React.JSX.Element {
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
    <>
      {Object.entries(MENUBAR_DATA).map(([key, data]) => {
        return (
          <MenubarItem
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
    </>
  )
}

export function createMenubar(app: App, view: HTMLDivElement) {
  if (!Flags.menuBar) return
  createRoot(view).render(<Menubar app={app} />)
}
