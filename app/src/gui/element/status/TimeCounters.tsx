import { Ticker } from "pixi.js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { App } from "../../../App"
import { EditMode } from "../../../chart/ChartManager"
import { roundDigit } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { parseString } from "../../../util/Util"
import { DropdownInput } from "../../inputs/DropdownInput"
import { InlineExpandingInput } from "./InlineExpandingInput"

export function TimeCounters(props: { app: App; state: EditMode }) {
  const [beat, setBeat] = useState(0)
  const [measure, setMeasure] = useState(0)
  const [time, setTime] = useState(0)

  const [beatType, setBeatType] = useState(
    Options.general.statusMeasures ? "Measure" : "Beat"
  )

  const ticker = useMemo(() => new Ticker(), [])

  const disableInputs =
    props.state != EditMode.View && props.state != EditMode.Edit

  useEffect(() => {
    let lastBeat = 0
    let lastTime = 0
    const update = () => {
      const chartManager = props.app.chartManager
      if (chartManager.beat !== lastBeat || chartManager.time !== lastTime) {
        lastBeat = chartManager.beat
        lastTime = chartManager.time

        setBeat(chartManager.beat)
        const measure =
          chartManager.loadedChart?.timingData?.getMeasure(chartManager.beat) ??
          chartManager.beat / 4
        setMeasure(measure)
        setTime(chartManager.time)
      }
    }
    ticker.maxFPS = 60
    ticker.start()
    ticker.add(update)
    return () => {
      ticker.remove(update)
    }
  }, [])

  useEffect(() => {
    Options.general.statusMeasures = beatType === "Measure"
  }, [beatType])

  const updateTime = useCallback(
    (min?: string, sec?: string, millis?: string) => {
      const time = props.app.chartManager.time
      min =
        min ??
        (time < 0 ? "-" : "") +
          Math.floor(Math.abs(time) / 60)
            .toString()
            .padStart(2, "0")
      sec = sec ?? Math.floor(Math.abs(time) % 60).toString()
      millis =
        millis?.padEnd(3, "0").slice(0, 3) ??
        (roundDigit(Math.abs(time) % 1, 3) * 1000).toString().padStart(3, "0")

      const minNum = parseString(min)
      const secNum = parseString(sec)
      const millisNum = parseString(millis)
      if (minNum === null || secNum === null || millisNum === null) {
        return
      }
      let t = minNum * 60 + secNum + millisNum / 1000
      if (t > 9999999) t = 9999999
      if (t < 0) t = 0
      props.app.chartManager.time = t
    },
    [props.app]
  )

  const updateBeat = useCallback(
    (val: string) => {
      let beat = parseString(val)
      if (beat === null) {
        return
      }
      if (beatType == "Measure") {
        const timingData = props.app.chartManager.loadedChart?.timingData
        beat = timingData?.getBeatFromMeasure(beat) ?? beat * 4
      }
      if (beat > 9999999) beat = 9999999
      if (beat < 0) beat = 0
      props.app.chartManager.beat = beat
    },
    [props.app, beatType]
  )

  return (
    <>
      <div className="playback-counter">
        <div className="playback-counter-main">
          <InlineExpandingInput
            value={
              (time < 0 ? "-" : "") +
              Math.floor(Math.abs(time) / 60)
                .toString()
                .padStart(2, "0")
            }
            onChange={val => {
              updateTime(val, undefined, undefined)
            }}
            disabled={disableInputs}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              maxWidth: `${27 / 16}rem`,
            }}
          />
          :
          <InlineExpandingInput
            value={Math.floor(Math.abs(time) % 60)
              .toString()
              .padStart(2, "0")}
            onChange={val => {
              updateTime(undefined, val, undefined)
            }}
            disabled={disableInputs}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              maxWidth: `${18 / 16}rem`,
            }}
          />
          .
          <InlineExpandingInput
            value={(roundDigit(Math.abs(time) % 1, 3) * 1000)
              .toString()
              .padStart(3, "0")}
            onChange={val => {
              updateTime(undefined, undefined, val)
            }}
            disabled={disableInputs}
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              maxWidth: `${27 / 16}rem`,
            }}
          />
        </div>
        <div className="playback-counter-label">Time</div>
      </div>
      <div className="playback-separator" />
      <div className="playback-counter">
        <div className="playback-counter-main">
          <InlineExpandingInput
            value={roundDigit(beatType == "Beat" ? beat : measure, 3).toFixed(
              3
            )}
            onChange={val => {
              updateBeat(val)
            }}
            disabled={disableInputs}
            style={{ textAlign: "center", fontSize: "1.1rem" }}
          />
        </div>
        <DropdownInput
          value={beatType}
          values={["Beat", "Measure"]}
          onChange={setBeatType}
          disabled={disableInputs}
          className="playback-counter-label"
        />
      </div>
    </>
  )
}
