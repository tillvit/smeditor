import { useContext, useEffect, useState } from "react"
import { roundDigit } from "../../../util/Math"
import { WaterfallManager } from "../../element/WaterfallManager"
import { WindowContext } from "../WindowManager"
import { SyncData } from "./SyncWindow"

export function SyncTempoView(props: { syncData: SyncData }) {
  const app = useContext(WindowContext)!.app
  const [shiftPressed, setShiftPressed] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift") {
        setShiftPressed(true)
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift") {
        setShiftPressed(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  return (
    <div style={{ display: "flex", position: "relative", gap: "0.625rem" }}>
      <section style={{ flex: 1 }}>
        <div className="sync-table-label">
          Offsets
          {props.syncData.offsetBPM
            ? ` (first BPM: ${props.syncData.offsetBPM})`
            : ""}
        </div>
        <table className="sync-table">
          <thead>
            <tr>
              <th>Offset</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {new Array(5).fill(0).map((_, i) => (
              <tr
                key={i}
                className={props.syncData.offsets[i] ? "" : "empty"}
                onClick={() => {
                  const offset = props.syncData.offsets[i]?.offset
                  if (offset === undefined) return
                  const timingData = app.chartManager.loadedChart!.timingData
                  if (timingData.hasChartOffset()) {
                    timingData.setOffset(offset)
                  } else {
                    timingData.songTimingData.setOffset(offset)
                  }
                  WaterfallManager.create(`Applied offset ${offset.toFixed(3)}`)
                }}
              >
                <td>{props.syncData.offsets[i]?.offset.toFixed(3) ?? "-"}</td>
                <td>
                  {props.syncData.offsets[i]?.confidence
                    ? Math.round(props.syncData.offsets[i].confidence * 100) +
                      "%"
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ flex: 1 }}>
        <div className="sync-table-label">Current Tempos</div>
        <table className="sync-table">
          <thead>
            <tr>
              <th>BPM</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {new Array(5).fill(0).map((_, i) => (
              <tr
                key={i}
                className={props.syncData.bpms[i] ? "" : "empty"}
                onClick={() => {
                  let bpm = props.syncData.bpms[i]?.bpm
                  if (bpm === undefined) return
                  bpm = roundDigit(bpm, shiftPressed ? 3 : 0)
                  const timingData = app.chartManager.loadedChart!.timingData
                  const beat = Math.round(app.chartManager.beat * 48) / 48
                  timingData.insertColumnEvents([
                    { type: "BPMS", beat, value: bpm },
                  ])
                  WaterfallManager.create(`Applied BPM ${bpm.toFixed(3)}`)
                }}
              >
                <td>
                  {props.syncData.bpms[i]?.bpm.toFixed(shiftPressed ? 3 : 0) ??
                    "-"}
                </td>
                <td>
                  {props.syncData.bpms[i]?.confidence
                    ? Math.round(props.syncData.bpms[i].confidence * 100) + "%"
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
