import { useEffect, useRef, useState } from "react"
import { App } from "../../../App"
import { MENUBAR_DATA, MenuOption } from "../../../data/MenubarData"
import { EventHandler } from "../../../util/EventHandler"
import { Flags } from "../../../util/Flags"
import { Options } from "../../../util/Options"
import { tippySafe } from "../../../util/Util"
import { ReactIcon } from "../../Icons"
import { MenubarDropdown } from "./MenubarDropdown"

export interface MenubarProps<T extends MenuOption = MenuOption> {
  app: App
  id: string
  data: T
  parentActive: string | null
  setActive: (key: string | null) => void
  close: () => void
}

export function evaluateDynamicProperty<T extends string | number | boolean>(
  app: App,
  property: T | ((app: App) => T)
) {
  if (typeof property === "function") {
    return property(app)
  }
  return property
}

export function Menubar(props: { app: App }) {
  if (!Flags.menuBar) return <></>

  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [playbackCollapsed, setPlaybackCollapsed] = useState(
    !Options.general.showPlaybackOptions
  )
  const collapseButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const menubar = document.getElementById("menubar")
    const clickOutside = (event: MouseEvent) => {
      if (!menubar!.contains(event.target as Node)) {
        setActiveItem(null)
      }
    }
    EventHandler.on("userOptionUpdated", id => {
      if (id === "general.showPlaybackOptions") {
        setPlaybackCollapsed(!Options.general.showPlaybackOptions)
      }
    })
    EventHandler.on("chartLoaded", () => {
      if (!collapseButtonRef.current) return
      collapseButtonRef.current.style.display = ""
    })
    document.addEventListener("pointerdown", clickOutside)
    return () => {
      document.removeEventListener("pointerdown", clickOutside)
    }
  }, [])

  useEffect(() => {
    if (!collapseButtonRef.current) return
    tippySafe(collapseButtonRef.current, {
      onShow(instance) {
        instance.setContent(
          Options.general.showPlaybackOptions
            ? "Hide playback options"
            : "Show playback options"
        )
      },
    })
  }, [collapseButtonRef.current])

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
      {Flags.playbackOptions && (
        <button
          className={"po-collapse " + (playbackCollapsed ? "" : "toggled")}
          style={{ display: "none" }}
          onClick={() => {
            Options.general.showPlaybackOptions =
              !Options.general.showPlaybackOptions
          }}
          ref={collapseButtonRef}
        >
          <ReactIcon id="CHEVRON" width={16} height={16} />
        </button>
      )}
    </div>
  )
}
