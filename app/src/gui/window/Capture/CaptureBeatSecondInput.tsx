import { useContext, useEffect, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { NumberInput } from "../../inputs/NumberInput"
import { WindowContext } from "../WindowManager"
import { CaptureOptionLabel } from "./CaptureOptionLabel"

export function CaptureBeatSecondInput(props: {
  beat: number
  setBeat: (newBeat: number) => void
  label: string
}) {
  const app = useContext(WindowContext)!.app
  const [second, setSecond] = useState(0)

  useEffect(() => {
    const recalcSecond = () => {
      const second = app.chartManager.loadedChart!.getSecondsFromBeat(
        props.beat
      )
      setSecond(second)
    }
    recalcSecond()
    EventHandler.on("timingModified", recalcSecond)
    return () => {
      EventHandler.off("timingModified", recalcSecond)
    }
  }, [props.beat])

  return (
    <CaptureOptionLabel label={props.label}>
      <div style={{ display: "flex", flexDirection: "row", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.85rem" }}>
          Beat:
          <NumberInput
            value={props.beat}
            min={0}
            precision={3}
            allowNull={false}
            onChange={value => {
              if (value == null) return
              const second =
                app.chartManager.loadedChart!.getSecondsFromBeat(value)
              props.setBeat(value)
              setSecond(second)
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.85rem" }}>
          Second:
          <NumberInput
            value={second}
            min={0}
            precision={3}
            allowNull={false}
            onChange={value => {
              if (value == null) return
              const beat =
                app.chartManager.loadedChart!.getBeatFromSeconds(value)
              props.setBeat(beat)
              setSecond(value)
            }}
          />
        </div>
      </div>
    </CaptureOptionLabel>
  )
}
