import { Graphics } from "pixi.js"
import { useEffect, useState } from "react"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { NumberInput } from "../inputs/NumberInput"
import { PopupEditIndicator } from "./PopupEditIndicator"
import { PopupData } from "./PopupManager"

function SnapPopupContent() {
  const [snap, setSnap] = useState(Options.chart.snap)

  function suffixSnap() {
    const div = snap == 0 ? 0 : Math.round(4 / snap)
    if (div % 10 == 1 && div != 11) return "st"
    if (div % 10 == 2 && div != 12) return "nd"
    if (div % 10 == 3 && div != 13) return "rd"
    return "th"
  }

  useEffect(() => {
    const snapChanged = (id: string) => {
      if (id != "chart.snap") return
      setSnap(Options.chart.snap)
    }
    EventHandler.on("userOptionUpdated", snapChanged)
    return () => {
      EventHandler.off("userOptionUpdated", snapChanged)
    }
  }, [])

  return (
    <div className="flex-column-full" style={{ padding: "0.5rem" }}>
      <div className="popup-title">Snap Options</div>
      <div className="popup-flex">
        <div className="popup-row">
          <div>Snap to nearest</div>
          <NumberInput
            value={snap == 0 ? 0 : Math.round(4 / snap)}
            onChange={value => {
              if (value === null) return
              if (value == 0) Options.chart.snap = 0
              else Options.chart.snap = 4 / value
              setSnap(Options.chart.snap)
            }}
            step={1}
            precision={0}
            min={0}
            max={1000}
            allowNull={false}
          />
          <div>{suffixSnap()} note</div>
        </div>
        <div className="popup-row">
          <div>Snap every</div>
          <NumberInput
            value={Options.chart.snap}
            onChange={value => {
              if (value === null) return
              if (value == 0) Options.chart.snap = 0
              else Options.chart.snap = value
            }}
            step={1}
            precision={3}
            min={0}
            max={1000}
            allowNull={false}
          />
          <div> beats</div>
        </div>
      </div>
      <PopupEditIndicator />
    </div>
  )
}

export function SnapPopup(snapSprite: Graphics): PopupData {
  return {
    attach: snapSprite,
    id: "snap-popup",
    width: 200,
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
    content: <SnapPopupContent />,
  }
}
