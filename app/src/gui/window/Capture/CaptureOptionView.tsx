import { Dispatch, SetStateAction, useContext, useEffect } from "react"
import { CaptureOptions } from "../../../util/Capture"
import { EventHandler } from "../../../util/EventHandler"
import { formatBytes } from "../../../util/Util"
import { WindowContext } from "../WindowManager"
import { CaptureBeatOptions } from "./CaptureBeatOptions"
import { CaptureVideoOptions } from "./CaptureVideoOptions"
import { CaptureViewOptions } from "./CaptureViewOptions"

export function CaptureOptionsView(props: {
  captureOptions: Omit<CaptureOptions, "startTime" | "endTime">
  setCaptureOptions: Dispatch<
    SetStateAction<Omit<CaptureOptions, "startTime" | "endTime">>
  >
  startBeat: number
  setStartBeat: Dispatch<SetStateAction<number>>
  endBeat: number
  setEndBeat: Dispatch<SetStateAction<number>>
  startRecording: () => void
}) {
  const app = useContext(WindowContext)!.app

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

  function getSizeEstimate() {
    const bitrate = props.captureOptions.bitrate
    const videoLength =
      app.chartManager.loadedChart!.getSecondsFromBeat(props.endBeat) -
      app.chartManager.loadedChart!.getSecondsFromBeat(props.startBeat) +
      2
    const sizeEstimate = Math.round((bitrate * videoLength) / 8)
    return sizeEstimate
  }

  console.log(props.captureOptions, props.startBeat, props.endBeat)

  return (
    <div
      className="capture-options-container"
      style={
        !VideoEncoder || !AudioEncoder
          ? {
              filter: "blur(10px) brightness(0.5)",
              pointerEvents: "none",
              background: "rgba(0, 0, 0, 0.5)",
            }
          : {}
      }
    >
      <div className="capture-options">
        <CaptureBeatOptions
          startBeat={props.startBeat}
          setStartBeat={props.setStartBeat}
          endBeat={props.endBeat}
          setEndBeat={props.setEndBeat}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        <CaptureVideoOptions
          captureOptions={props.captureOptions}
          setCaptureOptions={props.setCaptureOptions}
        />
        <CaptureViewOptions
          captureOptions={props.captureOptions}
          setCaptureOptions={props.setCaptureOptions}
        />
      </div>
      <button
        className="confirm"
        onClick={() => {
          props.startRecording()
        }}
      >
        Export Recording (Est. {formatBytes(getSizeEstimate())})
      </button>
    </div>
  )
}
