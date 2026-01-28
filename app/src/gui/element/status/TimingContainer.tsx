import { useEffect, useRef, useState } from "react"
import tippy from "tippy.js"
import { App } from "../../../App"
import { EditTimingMode } from "../../../chart/ChartManager"
import { EventHandler } from "../../../util/EventHandler"
import { Keybinds } from "../../../util/Keybinds"
import { roundDigit } from "../../../util/Math"
import { parseString } from "../../../util/Util"
import { ReactIcon } from "../../Icons"
import { PopupManager } from "../../popup/PopupManager"
import { SplitTimingPopup } from "../../popup/SplitTimingPopup"
import { TimingTrackOrderPopup } from "../../popup/TimingTrackOrderPopup"
import { SyncWindow } from "../../window/Sync/SyncWindow"
import { WindowManager } from "../../window/WindowManager"
import { InlineExpandingInput } from "./InlineExpandingInput"

export function TimingContainer(props: {
  app: App
  timingMode: EditTimingMode
}) {
  const [offset, setOffset] = useState(0)
  const splitRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const timingModified = () => {
      setOffset(props.app.chartManager.loadedChart?.timingData.getOffset() ?? 0)
    }
    timingModified()
    EventHandler.on("timingModified", timingModified)
    EventHandler.on("chartLoaded", timingModified)
    return () => {
      EventHandler.off("timingModified", timingModified)
      EventHandler.off("chartLoaded", timingModified)
    }
  }, [props.app])

  return (
    <div
      className="edit-timing-container"
      style={{
        transform:
          props.timingMode == EditTimingMode.Off ? "" : "translateY(-3rem)",
      }}
    >
      <button
        tabIndex={-1}
        ref={Keybinds.createReactKeybindTooltip`Add timing events ${"toggleAddTiming"}`}
        className={props.timingMode == EditTimingMode.Add ? "active" : ""}
        onClick={e => {
          if (props.app.chartManager.editTimingMode == EditTimingMode.Add)
            props.app.chartManager.editTimingMode = EditTimingMode.Edit
          else props.app.chartManager.editTimingMode = EditTimingMode.Add
          EventHandler.emit("timingModeChanged")
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="ADD_EVENT" width={32} height={32} />
      </button>
      <div className="playback-separator"></div>
      <button
        tabIndex={-1}
        ref={el => {
          if (!el) return
          tippy(el, {
            content: "Manage split timing",
          })
          splitRef.current = el
        }}
        onClick={e => {
          PopupManager.isOpen("split-timing")
            ? PopupManager.close("split-timing")
            : PopupManager.open(SplitTimingPopup(splitRef.current!))
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="SPLIT_TIMING" width={32} height={32} />
      </button>
      <button
        tabIndex={-1}
        ref={el => {
          if (!el) return
          tippy(el, {
            content: "Toggle timing track visibility",
          })
        }}
        onClick={e => {
          PopupManager.isOpen("timing-track-order-popup")
            ? PopupManager.close("timing-track-order-popup")
            : PopupManager.open(TimingTrackOrderPopup(e.currentTarget))
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="EYE" width={32} height={32} />
      </button>
      <button
        tabIndex={-1}
        ref={Keybinds.createReactKeybindTooltip`Detect audio sync ${"detectSync"}`}
        onClick={e => {
          WindowManager.openWindow(SyncWindow())
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="DETECT_SYNC" width={32} height={32} />
      </button>
      <div className="playback-separator"></div>
      <div className="playback-counter">
        <div className="playback-counter-main">
          <InlineExpandingInput
            value={roundDigit(offset, 3).toFixed(3)}
            onChange={val => {
              let offset = parseString(val)
              if (offset === null) {
                return
              }
              if (offset > 9999999) offset = 9999999
              if (offset < -9999999) offset = -9999999

              if (
                !props.app.chartManager.loadedChart ||
                !props.app.chartManager.loadedSM
              )
                return
              ;(props.app.chartManager.loadedChart.timingData.hasChartOffset()
                ? props.app.chartManager.loadedChart.timingData
                : props.app.chartManager.loadedSM.timingData
              ).setOffset(offset)
              props.app.chartManager.time =
                props.app.chartManager.loadedChart.timingData.getSecondsFromBeat(
                  props.app.chartManager.beat
                )
            }}
            style={{ textAlign: "center", fontSize: "1.1rem" }}
          />
        </div>
        <div className="playback-counter-label">Offset</div>
      </div>
    </div>
  )
}
