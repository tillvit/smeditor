import { useContext } from "react"
import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import { DropdownInput } from "../../inputs/DropdownInput"
import { NumberInput } from "../../inputs/NumberInput"
import { WindowContext } from "../WindowManager"
import { precisionSettings } from "./TimingDataWindow"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function SpeedRow(props: {
  td: ChartTimingData
  sameRow: boolean
  value: { value: number; delay: number; unit: "B" | "T" }
}) {
  const app = useContext(WindowContext)!.app

  function onChange(value: number, delay: number, unit: "B" | "T") {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.insertColumnEvents([{ type: "SPEEDS", beat, value, delay, unit }])
  }

  function createNewEvent(value: number) {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.insertColumnEvents([
      { type: "SPEEDS", beat, value, delay: 0, unit: "B" },
    ])
  }

  function deleteSpeed() {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.deleteColumnEvents([{ type: "SPEEDS", beat }])
  }

  return (
    <TimingDataWindowRow title="Speed">
      <div className="flex-column-gap">
        <NumberInput
          {...precisionSettings}
          step={0.1}
          value={props.value.value}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteSpeed()
              return
            }
            if (!props.sameRow) {
              createNewEvent(value)
              return
            }
            onChange(value, props.value.delay, props.value.unit)
          }}
        />
        <NumberInput
          disabled={!props.sameRow}
          {...precisionSettings}
          step={0.1}
          min={0}
          value={props.value.delay}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteSpeed()
              return
            }
            onChange(props.value.value, value, props.value.unit)
          }}
        />
        <DropdownInput
          disabled={!props.sameRow}
          values={["Beats", "Time"]}
          value={props.value.unit == "B" ? "Beats" : "Time"}
          onChange={value => {
            const unit = value == "Beats" ? "B" : "T"
            onChange(props.value.value, props.value.delay, unit)
          }}
        />
      </div>
    </TimingDataWindowRow>
  )
}
