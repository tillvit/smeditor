import {
  NoteskinRegistry,
  NoteskinRegistryData,
} from "../../../chart/gameTypes/noteskin/NoteskinRegistry"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"

import { useContext, useEffect, useRef, useState } from "react"
import placeholderPreview from "../../../../assets/preview.png"
import { GameTypeRegistry } from "../../../chart/gameTypes/GameTypeRegistry"
import { WindowContext, WindowData } from "../WindowManager"

function NoteskinWindowContent() {
  const windowData = useContext(WindowContext)
  const [query, setQuery] = useState("")
  const [noteskins, setNoteskins] = useState<NoteskinRegistryData[]>([])
  const [gameType, setGameType] = useState(
    GameTypeRegistry.getGameType("dance-single")!
  )
  const [selectedSkin, setSelectedSkin] = useState(Options.chart.noteskin.name)
  const shouldScroll = useRef(true)

  useEffect(() => {
    const chartLoaded = () => {
      if (!windowData) return
      const newGameType =
        windowData.app.chartManager.loadedChart?.gameType ??
        GameTypeRegistry.getGameType("dance-single")!
      setGameType(newGameType)
      setSelectedSkin(Options.chart.noteskin.name)
    }
    const noteskinChanged = (id: string) => {
      if (id != "chart.noteskin.name") return
      setSelectedSkin(Options.chart.noteskin.name)
    }
    EventHandler.on("chartLoaded", chartLoaded)
    EventHandler.on("userOptionUpdated", noteskinChanged)
    return () => {
      EventHandler.off("chartLoaded", chartLoaded)
      EventHandler.off("userOptionUpdated", noteskinChanged)
    }
  }, [windowData])

  useEffect(() => {
    if (!windowData) return
    setGameType(
      windowData.app.chartManager.loadedChart?.gameType ??
        GameTypeRegistry.getGameType("dance-single")!
    )
  }, [windowData])

  useEffect(() => {
    const noteskins = NoteskinRegistry.getNoteskins().get(gameType.id)
    if (!noteskins) {
      setNoteskins([])
      return
    }
    setNoteskins([...noteskins.values()])
    shouldScroll.current = true
  }, [gameType])

  function containsQuery(query: string, string: string | undefined) {
    if (!string) return false
    return string.toLowerCase().includes(query.trim().toLowerCase())
  }

  return (
    <div className="flex-column-full">
      <input
        className="pref-search-bar"
        type="text"
        placeholder="Search for a noteskin..."
        value={query}
        onChange={e => {
          setQuery(e.target.value)
        }}
      />
      <div className="noteskin-grid">
        {noteskins
          .filter(
            skin =>
              containsQuery(query, skin.id) ||
              containsQuery(query, skin.title) ||
              containsQuery(query, skin.subtitle)
          )
          .map(skin => {
            return (
              <div
                key={skin.id}
                className={
                  "noteskin-cell " + (skin.id == selectedSkin ? "selected" : "")
                }
                onClick={() => {
                  if (Options.chart.noteskin.name == skin.id) return
                  windowData!.app.chartManager.chartView?.swapNoteskin(skin.id)
                  setSelectedSkin(skin.id)
                }}
                ref={el => {
                  if (el && skin.id == selectedSkin && shouldScroll.current) {
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
                <img
                  src={skin.preview}
                  alt={skin.title}
                  onError={e => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = placeholderPreview
                  }}
                />
                <div className="noteskin-label">
                  <div className="noteskin-title">{skin.title}</div>
                  <div className="noteskin-subtitle">{skin.subtitle}</div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export function NoteskinWindow(): WindowData {
  return {
    title: "Noteskin Selection",
    width: 600,
    height: 400,
    id: "noteskin-selection",
    content: <NoteskinWindowContent />,
  }
}
