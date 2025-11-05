import { useContext, useEffect, useRef, useState } from "react"
import { TimingEventType } from "../../chart/sm/TimingTypes"
import { SPLIT_TIMING_DATA } from "../../data/SplitTimingData"
import { EventHandler } from "../../util/EventHandler"
import { PopupContext, PopupData } from "./PopupManager"

type SplitMap = Record<TimingEventType, boolean> & { OFFSET: boolean }

function SplitTimingPopupContent() {
  const popupData = useContext(PopupContext)!
  const timingData = popupData.app.chartManager.loadedChart!.timingData
  const [splitMap, setSplitMap] = useState<SplitMap>({
    OFFSET: false,
    BPMS: false,
    STOPS: false,
    WARPS: false,
    DELAYS: false,
    LABELS: false,
    SPEEDS: false,
    SCROLLS: false,
    TICKCOUNTS: false,
    TIMESIGNATURES: false,
    COMBOS: false,
    FAKES: false,
    ATTACKS: false,
    BGCHANGES: false,
    FGCHANGES: false,
  })
  const consistent = Object.values(splitMap).every(v => v === splitMap.OFFSET)

  const buttonOne = useRef<HTMLButtonElement>(null)
  const buttonTwo = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onTimingModified = () => {
      for (const key in splitMap) {
        const type = key as TimingEventType | "OFFSET"
        const isChart =
          type == "OFFSET"
            ? timingData.hasChartOffset()
            : timingData.isPropertyChartSpecific(type)
        setSplitMap(prev => ({
          ...prev,
          [type]: isChart,
        }))
      }
    }
    onTimingModified()
    EventHandler.on("timingModified", onTimingModified)
    return () => EventHandler.off("timingModified", onTimingModified)
  }, [])

  return (
    <div
      className="flex-column-full"
      style={{ padding: "0.5rem", gap: "0.5rem" }}
    >
      <div>
        <div className="popup-title">Manage Split Timing</div>
        <div className="popup-desc">
          Manage whether timing events are shared across multiple difficulties.
        </div>
      </div>
      <div>
        <div
          className="popup-title"
          style={{ fontSize: "0.9rem", fontWeight: "bold", gap: "0.5rem" }}
        >
          {consistent
            ? splitMap.OFFSET
              ? "Chart Timing"
              : "Song Timing"
            : "Mixed Timing"}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            textAlign: "center",
            color: consistent ? "" : "#fff7a1ff",
          }}
        >
          {consistent
            ? splitMap.OFFSET
              ? "All timing events are chart-specific."
              : "All timing events are song-specific."
            : "Some timing events are chart-specific."}
        </div>
      </div>
      <div
        style={{
          border: "0.05rem solid var(--secondary-border)",
        }}
      ></div>
      {(["chart", "song"] as const)
        .filter(type => !consistent || splitMap.OFFSET != (type != "chart"))
        .map(type => (
          <div key={type}>
            <div className="popup-title" style={{ fontSize: "0.85rem" }}>
              {SPLIT_TIMING_DATA[type].convertText}
            </div>
            <div
              className="flex-column-full popup-area"
              style={{
                gap: "0.5rem",
                background: "var(--secondary-bg)",
                padding: "0.5rem",
              }}
            >
              <button
                ref={buttonOne}
                onClick={() => {
                  SPLIT_TIMING_DATA[type].buttonOne.actionAll(timingData)
                }}
              >
                {SPLIT_TIMING_DATA[type].buttonOne.text}
              </button>
              <button
                ref={buttonTwo}
                className={type === "chart" ? "delete" : ""}
                onClick={() => {
                  SPLIT_TIMING_DATA[type].buttonTwo.actionAll(timingData)
                }}
              >
                {SPLIT_TIMING_DATA[type].buttonTwo.text}
              </button>
            </div>
          </div>
        ))}
    </div>
  )
}

export function SplitTimingPopup(attach: HTMLElement): PopupData {
  return {
    attach,
    id: "split-timing-popup",
    offset: { x: 0, y: -25 },
    pivot: { x: 0.5, y: 1 },
    content: <SplitTimingPopupContent />,
  }
}
