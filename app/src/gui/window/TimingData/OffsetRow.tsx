import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import { Options } from "../../../util/Options"
import { NumberInput } from "../../inputs/NumberInput"
import { precisionSettings } from "./TimingDataWindow"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function OffsetRow(props: { td: ChartTimingData; value: number }) {
  return (
    <TimingDataWindowRow title="Offset">
      <NumberInput
        {...precisionSettings}
        step={Options.general.spinnerStep / 100}
        value={props.value}
        allowNull={false}
        onChange={value => {
          if (value == null) return
          if (props.td.hasChartOffset()) {
            props.td.setOffset(value)
          } else {
            props.td.songTimingData.setOffset(value)
          }
        }}
      />
    </TimingDataWindowRow>
  )
}
