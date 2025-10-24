import { Point } from "pixi.js"
import { useContext, useMemo, useState } from "react"
import { EditMode } from "../../chart/ChartManager"
import { MENUBAR_DATA } from "../../data/MenubarData"
import { PopupContext, PopupData } from "../popup/PopupManager"
import { MenubarDropdown } from "./menubar/MenubarDropdown"
import { MenubarSelection } from "./menubar/MenubarSelection"

const DEFAULT_KEYBINDS = ["cut", "copy", "paste", "pasteReplace"]

export function ContextMenuPopupContent() {
  const popupData = useContext(PopupContext)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const hasNoteSelection = useMemo(() => {
    if (!popupData) return false
    const app = popupData.app
    return (
      app.chartManager.getMode() == EditMode.Edit &&
      app.chartManager.hasNoteSelection()
    )
  }, [])

  if (!popupData) return <></>

  return (
    <div>
      {DEFAULT_KEYBINDS.map(keybindId => (
        <MenubarSelection
          key={keybindId}
          app={popupData.app}
          setActive={setActiveItem}
          parentActive={activeItem}
          data={{
            type: "selection",
            id: keybindId,
          }}
          id={keybindId}
          close={() => popupData.close()}
        />
      ))}
      {hasNoteSelection && (
        <>
          <div className="separator" />
          {MENUBAR_DATA["selection"].options.slice(0, -4).map((option, i) => {
            const newProps = {
              app: popupData.app,
              id: i.toString(),
              parentActive: activeItem,
              setActive: setActiveItem,
              close: () => {
                popupData.close()
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
        </>
      )}
    </div>
  )
}

export function ContextMenuPopup(event: MouseEvent): PopupData {
  return {
    id: "context-menu",
    attach: new Point(event.clientX, event.clientY),
    content: <ContextMenuPopupContent />,
    pivot: { x: 0, y: 0 },
    className: "context-menu-popup",
  }
}
