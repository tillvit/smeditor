import { useContext } from "react"
import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import {
  TIMING_DATA_DISPLAY_PRECISION,
  TIMING_DATA_PRECISION,
} from "../../../chart/sm/TimingData"
import { Options } from "../../../util/Options"
import { NumberInput } from "../../inputs/NumberInput"
import { WindowContext } from "../WindowManager"
import { precisionSettings } from "./TimingDataWindow"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function SimpleTimingRow(props: {
  td: ChartTimingData
  title: string
  type:
    | "BPMS"
    | "STOPS"
    | "WARPS"
    | "DELAYS"
    | "SCROLLS"
    | "FAKES"
    | "TICKCOUNTS"
  value: number
  min?: number
  precision?: number
  minPrecision?: number | null
  step?: number
}) {
  const app = useContext(WindowContext)!.app
  function onChange(value: number | null) {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    if (value == null) {
      props.td.deleteColumnEvents([{ type: props.type, beat }])
      return
    }
    props.td.insertColumnEvents([{ type: props.type, beat, value }])
  }

  return (
    <TimingDataWindowRow title={props.title}>
      <NumberInput
        {...precisionSettings}
        precision={props.precision ?? TIMING_DATA_PRECISION}
        minPrecision={
          props.minPrecision !== undefined
            ? props.minPrecision
            : TIMING_DATA_DISPLAY_PRECISION
        }
        min={props.min ?? -Number.MAX_VALUE}
        step={props.step ?? Options.general.spinnerStep / 100}
        value={props.value}
        allowNull={true}
        onChange={onChange}
      />
    </TimingDataWindowRow>
  )
}
