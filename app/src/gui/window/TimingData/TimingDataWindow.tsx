import { Ticker } from "pixi.js"
import { useContext, useEffect, useState } from "react"
import {
  TIMING_DATA_DISPLAY_PRECISION,
  TIMING_DATA_PRECISION,
  TimingData,
} from "../../../chart/sm/TimingData"
import { EventHandler } from "../../../util/EventHandler"
import { isSameRow } from "../../../util/Util"
import { WindowContext, WindowData } from "../WindowManager"
import { ComboRow } from "./ComboRow"
import { LabelRow } from "./LabelRow"
import { OffsetRow } from "./OffsetRow"
import { SimpleTimingRow } from "./SimpleTimingRow"
import { SpeedRow } from "./SpeedRow"
import { TimeSignatureRow } from "./TimeSignatureRow"

export const precisionSettings = {
  precision: TIMING_DATA_PRECISION,
  minPrecision: TIMING_DATA_DISPLAY_PRECISION,
}

type TimingDataFetched = {
  offset: number
  isSpeedSameRow: boolean
  BPMS: number
  STOPS: number
  WARPS: number
  DELAYS: number
  LABELS: string
  SPEEDS: { value: number; delay: number; unit: "B" | "T" }
  SCROLLS: number
  TICKCOUNTS: number
  TIMESIGNATURES: { upper: number; lower: number }
  COMBOS: { hitMult: number; missMult: number }
  FAKES: number
}

function TimingDataWindowContent() {
  const windowData = useContext(WindowContext)!
  const [chart, setChart] = useState(windowData.app.chartManager.loadedChart!)
  const [beat, setBeat] = useState(windowData.app.chartManager.beat)
  const td = chart.timingData

  const [currentData, setCurrentData] = useState(fetchData())

  function fetchData() {
    const data: Partial<TimingDataFetched> = {
      offset: td.getOffset(),
      LABELS: td.getEventAtBeat("LABELS", beat)?.value ?? "",
    }
    for (const prop of [
      "BPMS",
      "STOPS",
      "WARPS",
      "DELAYS",
      "SCROLLS",
      "FAKES",
      "TICKCOUNTS",
    ] as const) {
      const event = td.getEventAtBeat(prop, beat)
      let value = event?.value ?? 0
      if (
        TimingData.getColumnType(prop) == "instant" &&
        (!event || Math.abs(event.beat - beat) > 1 / 48)
      ) {
        value = 0
      }
      data[prop] = value
    }
    const speedEvent = td.getEventAtBeat("SPEEDS", beat)!
    data.SPEEDS = {
      value: speedEvent.value,
      delay: speedEvent.delay,
      unit: speedEvent.unit,
    }
    data.isSpeedSameRow = isSameRow(speedEvent.beat, beat)
    const timeSigEvent = td.getEventAtBeat("TIMESIGNATURES", beat)!
    data.TIMESIGNATURES = {
      upper: timeSigEvent.upper,
      lower: timeSigEvent.lower,
    }
    const comboEvent = td.getEventAtBeat("COMBOS", beat)!
    data.COMBOS = {
      hitMult: comboEvent.hitMult,
      missMult: comboEvent.missMult,
    }
    return data as TimingDataFetched
  }

  useEffect(() => {
    const onChartLoaded = () => {
      const newChart = windowData.app.chartManager.loadedChart!
      setChart(newChart)
    }
    EventHandler.on("chartLoaded", onChartLoaded)
    return () => {
      EventHandler.off("chartLoaded", onChartLoaded)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const newBeat = windowData.app.chartManager.beat
      if (!isSameRow(beat, newBeat)) {
        setBeat(newBeat)
      }
    }
    Ticker.shared.add(update)
    return () => {
      Ticker.shared.remove(update)
    }
  }, [beat])

  useEffect(() => {
    setCurrentData(fetchData())
    const onTimingModified = () => {
      setCurrentData(fetchData())
    }
    EventHandler.on("timingModified", onTimingModified)
    return () => {
      EventHandler.off("timingModified", onTimingModified)
    }
  }, [td, beat])

  return (
    <div className="flex-column-full timing-data">
      <OffsetRow td={td} value={currentData.offset} />
      <SimpleTimingRow
        td={td}
        title="BPM"
        type="BPMS"
        value={currentData.BPMS}
      />
      <SimpleTimingRow
        td={td}
        title="Stop"
        type="STOPS"
        value={currentData.STOPS}
      />
      <SimpleTimingRow
        td={td}
        title="Delay"
        type="DELAYS"
        value={currentData.DELAYS}
      />
      <SimpleTimingRow
        td={td}
        title="Warp"
        type="WARPS"
        value={currentData.WARPS}
        min={0}
      />
      <TimeSignatureRow td={td} value={currentData.TIMESIGNATURES} />
      <SimpleTimingRow
        td={td}
        title="Tickcount"
        type="TICKCOUNTS"
        value={currentData.TICKCOUNTS}
        step={1}
        precision={0}
        minPrecision={null}
        min={0}
      />
      <ComboRow td={td} value={currentData.COMBOS} />
      <SpeedRow
        td={td}
        value={currentData.SPEEDS}
        sameRow={currentData.isSpeedSameRow}
      />
      <SimpleTimingRow
        td={td}
        title="Scroll"
        type="SCROLLS"
        value={currentData.SCROLLS}
      />
      <SimpleTimingRow
        td={td}
        title="Fake"
        type="FAKES"
        value={currentData.FAKES}
      />
      <LabelRow td={td} value={currentData.LABELS} />
    </div>
  )
}

export function TimingDataWindow(): WindowData {
  return {
    title: "Edit Timing Data",
    width: 300,
    height: 340,
    id: "timing-data",
    content: <TimingDataWindowContent />,
  }
}
