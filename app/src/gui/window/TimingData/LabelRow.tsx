import { useContext } from "react"
import { ChartTimingData } from "../../../chart/sm/ChartTimingData"
import { TextInput } from "../../inputs/TextInput"
import { WindowContext } from "../WindowManager"
import { TimingDataWindowRow } from "./TimingDataWindowRow"

export function LabelRow(props: { td: ChartTimingData; value: string }) {
  const app = useContext(WindowContext)!.app

  return (
    <TimingDataWindowRow title="Label">
      <TextInput
        value={props.value}
        onChange={value => {
          const beat = Math.round(app.chartManager.beat * 48) / 48
          if (value === "") {
            props.td.deleteColumnEvents([{ type: "LABELS", beat }])
            return
          }
          props.td.insertColumnEvents([{ type: "LABELS", beat, value }])
        }}
      />
    </TimingDataWindowRow>
  )
}
