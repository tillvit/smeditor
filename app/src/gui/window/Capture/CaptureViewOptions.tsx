import { Dispatch, SetStateAction } from "react"
import { CaptureOptions } from "../../../util/Capture"
import { CheckboxInput } from "../../inputs/CheckboxInput"
import { NumberInput } from "../../inputs/NumberInput"
import { CaptureOptionLabel } from "./CaptureOptionLabel"

export function CaptureViewOptions(props: {
  captureOptions: Omit<CaptureOptions, "startTime" | "endTime">
  setCaptureOptions: Dispatch<
    SetStateAction<Omit<CaptureOptions, "startTime" | "endTime">>
  >
}) {
  return (
    <div className="capture-options">
      <div className="capture-options-label">View Options</div>
      <CaptureOptionLabel label={"Hide edit GUI"}>
        <CheckboxInput
          value={props.captureOptions.hideBarlines}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              hideBarlines: value,
            }))
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Playback Rate"}>
        <NumberInput
          value={props.captureOptions.playbackRate}
          min={10}
          max={300}
          step={10}
          precision={3}
          minPrecision={0}
          transformers={{
            serialize: (value: number) => value * 100,
            deserialize: (value: number) => value / 100,
          }}
          allowNull={false}
          onChange={value => {
            if (value === null) return
            props.setCaptureOptions(prev => ({
              ...prev,
              playbackRate: value,
            }))
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Assist Tick"}>
        <CheckboxInput
          value={props.captureOptions.assistTick}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              assistTick: value,
            }))
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Metronome"}>
        <CheckboxInput
          value={props.captureOptions.metronome}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              metronome: value,
            }))
          }}
        />
      </CaptureOptionLabel>
    </div>
  )
}
