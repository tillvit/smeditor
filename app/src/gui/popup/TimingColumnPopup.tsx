import { Color, Container } from "pixi.js"
import { useContext, useEffect, useRef, useState } from "react"
import tippy from "tippy.js"
import { ChartTimingData } from "../../chart/sm/ChartTimingData"
import { TimingEventType } from "../../chart/sm/TimingTypes"
import { SPLIT_TIMING_DATA } from "../../data/SplitTimingData"
import { blendPixiColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Themes } from "../../util/Theme"
import { PopupEditIndicator } from "./PopupEditIndicator"
import { PopupContext, PopupData } from "./PopupManager"

interface TimingColumnPopupOptions {
  attach: Container
  type: TimingEventType
  timingData: ChartTimingData
}

function TimingColumnPopupContent(props: TimingColumnPopupOptions) {
  const popupData = useContext(PopupContext)

  const [columnType, setColumnType] = useState<"chart" | "song">(
    props.timingData.isPropertyChartSpecific(props.type) ? "chart" : "song"
  )

  const buttonOne = useRef<HTMLButtonElement>(null)
  const buttonTwo = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onTimingChange = () => {
      setColumnType(
        props.timingData.isPropertyChartSpecific(props.type) ? "chart" : "song"
      )
    }
    EventHandler.on("timingModified", onTimingChange)
    return () => {
      EventHandler.off("timingModified", onTimingChange)
    }
  }, [])

  useEffect(() => {
    if (buttonOne.current)
      tippy(buttonOne.current, {
        content: SPLIT_TIMING_DATA[columnType].buttonOne.tooltip,
      })
    if (buttonTwo.current)
      tippy(buttonTwo.current, {
        content: SPLIT_TIMING_DATA[columnType].buttonTwo.tooltip,
      })
  }, [columnType])

  const secondaryBg = Themes.getColor("secondary-bg")

  return (
    <div className="flex-column-full" style={{ padding: "0.5rem" }}>
      <div className="popup-title">{SPLIT_TIMING_DATA[columnType].title}</div>
      <div className="popup-desc">{SPLIT_TIMING_DATA[columnType].desc}</div>
      <div
        style={{
          border: "0.05rem solid var(--secondary-border)",
          margin: "0.5rem 0",
        }}
      ></div>
      <div className="popup-title" style={{ fontSize: "0.85rem" }}>
        {SPLIT_TIMING_DATA[columnType].convertText}
      </div>
      <div
        className="flex-column-full popup-area"
        style={{
          gap: "0.5rem",
          background: popupData?.highlighted
            ? blendPixiColors(secondaryBg, new Color("white"), 0.05).toHex()
            : secondaryBg.toHex(),
          padding: "0.5rem",
        }}
      >
        <button
          ref={buttonOne}
          onClick={() => {
            SPLIT_TIMING_DATA[columnType].buttonOne.action(
              props.timingData,
              props.type
            )
            popupData?.close()
          }}
        >
          {SPLIT_TIMING_DATA[columnType].buttonOne.text}
        </button>
        <button
          ref={buttonTwo}
          className={columnType === "chart" ? "delete" : ""}
          onClick={() => {
            SPLIT_TIMING_DATA[columnType].buttonTwo.action(
              props.timingData,
              props.type
            )
            popupData?.close()
          }}
        >
          {SPLIT_TIMING_DATA[columnType].buttonTwo.text}
        </button>
      </div>
      <PopupEditIndicator />
    </div>
  )
}

export function TimingColumnPopup(
  options: TimingColumnPopupOptions
): PopupData {
  return {
    attach: options.attach,
    id: "timing-column-popup",
    width: 200,
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
    content: <TimingColumnPopupContent {...options} />,
  }
}
