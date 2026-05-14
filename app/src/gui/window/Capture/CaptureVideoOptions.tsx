import { Dispatch, SetStateAction, useState } from "react"
import { CaptureOptions } from "../../../util/Capture"
import { DisplaySliderInput } from "../../inputs/DisplaySliderInput"
import { DropdownInput } from "../../inputs/DropdownInput"
import { CaptureOptionLabel } from "./CaptureOptionLabel"

const ASPECT_MAP = {
  "4 / 3": 4 / 3,
  "16 / 9": 16 / 9,
  "16 / 10": 16 / 10,
}

function getAspectString(aspect: number): string {
  for (const key in ASPECT_MAP) {
    if (ASPECT_MAP[key as keyof typeof ASPECT_MAP] === aspect) {
      return key
    }
  }
  return "16 / 9"
}

export function CaptureVideoOptions(props: {
  captureOptions: Omit<CaptureOptions, "startTime" | "endTime">
  setCaptureOptions: Dispatch<
    SetStateAction<Omit<CaptureOptions, "startTime" | "endTime">>
  >
}) {
  const [preset, setPreset] = useState("Medium")

  return (
    <div className="capture-options">
      <div className="capture-options-label">Video Options</div>
      <CaptureOptionLabel label={"Quality Preset"}>
        <DropdownInput
          value={preset}
          values={["Minimal", "Low", "Medium", "High"]}
          onChange={value => {
            setPreset(value)
            switch (value) {
              case "Minimal":
                props.setCaptureOptions(prev => ({
                  ...prev,
                  videoHeight: 360,
                  fps: 24,
                  bitrate: 1e6,
                }))
                break
              case "Low":
                props.setCaptureOptions(prev => ({
                  ...prev,
                  videoHeight: 480,
                  fps: 30,
                  bitrate: 2.5e6,
                }))
                break
              case "Medium":
                props.setCaptureOptions(prev => ({
                  ...prev,
                  videoHeight: 720,
                  fps: 60,
                  bitrate: 4e6,
                }))
                break
              case "High":
                props.setCaptureOptions(prev => ({
                  ...prev,
                  videoHeight: 1080,
                  fps: 60,
                  bitrate: 8e6,
                }))
                break
            }
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Video Height"}>
        <DropdownInput
          value={props.captureOptions.videoHeight + "p"}
          values={["360p", "480p", "720p", "1080p"]}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              videoHeight: parseInt(value),
            }))
            setPreset("Custom")
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"FPS"}>
        <DropdownInput
          value={props.captureOptions.fps.toString()}
          values={["24", "30", "60"]}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              fps: parseInt(value),
            }))
            setPreset("Custom")
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Bitrate"}>
        <DisplaySliderInput
          value={props.captureOptions.bitrate}
          transformers={{
            serialize: (value: number) => {
              return Math.log(value)
            },
            deserialize: (value: number) => {
              return Math.round(Math.exp(value) / 1000) * 1000
            },
            display: (value: number) => {
              return value / 1000 + " kbps"
            },
          }}
          min={Math.log(1e6)}
          max={Math.log(2e7)}
          step={0.00001}
          displayWidth={80}
          sliderWidth={80}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              bitrate: value,
            }))
            setPreset("Custom")
          }}
        />
      </CaptureOptionLabel>
      <CaptureOptionLabel label={"Aspect Ratio"}>
        <DropdownInput
          value={getAspectString(props.captureOptions.aspectRatio)}
          values={["4 / 3", "16 / 9", "16 / 10"]}
          onChange={value => {
            props.setCaptureOptions(prev => ({
              ...prev,
              aspectRatio: ASPECT_MAP[value as keyof typeof ASPECT_MAP],
            }))
          }}
        />
      </CaptureOptionLabel>
    </div>
  )
}
