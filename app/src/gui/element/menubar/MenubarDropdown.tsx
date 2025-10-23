import { useState } from "react"
import { MenuDropdown, MenuMain } from "../../../data/MenubarData"
import { ReactIcon } from "../../Icons"
import { MenubarProps } from "./Menubar"
import { MenubarSelection } from "./MenubarSelection"
import { SearchBar } from "./SearchBar"

export function MenubarDropdown(props: MenubarProps<MenuDropdown | MenuMain>) {
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
