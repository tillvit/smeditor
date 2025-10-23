import { Dispatch, SetStateAction, useEffect } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { CaptureBeatSecondInput } from "./CaptureBeatSecondInput"

export function CaptureBeatOptions(props: {
  startBeat: number
  setStartBeat: Dispatch<SetStateAction<number>>
  endBeat: number
  setEndBeat: Dispatch<SetStateAction<number>>
}) {
  useEffect(() => {
    const onRegionChange = (startBeat: number, endBeat: number) => {
      props.setStartBeat(startBeat)
      props.setEndBeat(endBeat)
    }
    EventHandler.on("regionChanged", onRegionChange)
    return () => {
      EventHandler.off("regionChanged", onRegionChange)
    }
  }, [])

  return (
    <>
      <div className="capture-options-label">Record Range</div>
      <CaptureBeatSecondInput
        label="Start"
        beat={props.startBeat}
        setBeat={value => {
          props.setStartBeat(Math.min(value, props.endBeat))
        }}
      />
      <CaptureBeatSecondInput
        label="End"
        beat={props.endBeat}
        setBeat={value => {
          props.setEndBeat(Math.max(value, props.startBeat))
        }}
      />
    </>
  )
}
