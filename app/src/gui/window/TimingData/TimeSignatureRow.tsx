import { useContext } from "react"
import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import { NumberInput } from "../../inputs/NumberInput"
import { WindowContext } from "../WindowManager"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function TimeSignatureRow(props: {
  td: ChartTimingData
  value: {
    upper: number
    lower: number
  }
}) {
  const app = useContext(WindowContext)!.app

  function onChange(upper: number, lower: number) {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.insertColumnEvents([
      { type: "TIMESIGNATURES", beat, upper, lower },
    ])
  }

  function deleteTimeSignature() {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.deleteColumnEvents([{ type: "TIMESIGNATURES", beat }])
  }

  return (
    <TimingDataWindowRow title="Time Sig.">
      <div className="flex-column-gap">
        <NumberInput
          step={1}
          precision={0}
          min={1}
          value={props.value.upper}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteTimeSignature()
              return
            }
            onChange(value, props.value.lower)
          }}
        />
        <NumberInput
          step={1}
          precision={0}
          min={1}
          value={props.value.lower}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteTimeSignature()
              return
            }
            onChange(props.value.upper, value)
          }}
        />
      </div>
    </TimingDataWindowRow>
  )
}
