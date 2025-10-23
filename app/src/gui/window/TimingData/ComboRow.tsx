import { useContext } from "react"
import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import { NumberInput } from "../../inputs/NumberInput"
import { WindowContext } from "../WindowManager"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function ComboRow(props: {
  td: ChartTimingData
  value: {
    hitMult: number
    missMult: number
  }
}) {
  const app = useContext(WindowContext)!.app

  function onChange(hitMult: number, missMult: number) {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.insertColumnEvents([{ type: "COMBOS", beat, hitMult, missMult }])
  }

  function deleteCombo() {
    const beat = Math.round(app.chartManager.beat * 48) / 48
    props.td.deleteColumnEvents([{ type: "COMBOS", beat }])
  }

  return (
    <TimingDataWindowRow title="Combo">
      <div className="flex-column-gap">
        <NumberInput
          step={1}
          precision={0}
          min={1}
          value={props.value.hitMult}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteCombo()
              return
            }
            onChange(value, props.value.missMult)
          }}
        />
        <NumberInput
          step={1}
          precision={0}
          min={1}
          value={props.value.missMult}
          allowNull={true}
          onChange={value => {
            if (value == null) {
              deleteCombo()
              return
            }
            onChange(props.value.hitMult, value)
          }}
        />
      </div>
    </TimingDataWindowRow>
  )
}
