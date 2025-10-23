import { RefObject, useEffect, useState } from "react"
import { Capture } from "../../../util/Capture"
import { formatBytes, formatSeconds } from "../../../util/Util"
import { CaptureState } from "./CaptureWindow"

export function CaptureRecordingView(props: {
  capture: RefObject<Capture | null>
  state: CaptureState
  setState: (state: CaptureState) => void
  videoURL: string | null
  videoSize: number | null
  canvasRef: RefObject<HTMLCanvasElement | null>
  progress: number
}) {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(-1)

  useEffect(() => {
    if (props.state !== "recording") return
    const estimateQueue: number[] = []

    let estimatedTimeRemaining = -1
    let estimateLastFrame = 0

    const estimateInterval = setInterval(() => {
      if (!props.capture.current) {
        return
      }
      const currentFrame =
        props.capture.current.currentRenderFrame -
        props.capture.current.currentEncodeQueue
      estimateQueue.push(currentFrame - estimateLastFrame)
      estimateLastFrame = currentFrame
      if (estimateQueue.length > 20) {
        estimateQueue.shift()
      }
      const sum = estimateQueue.reduce((a, b) => a + b, 0)
      const average = sum / estimateQueue.length
      const remainingFrames = props.capture.current.totalFrames - currentFrame
      estimatedTimeRemaining = Math.round(remainingFrames / average)
      setEstimatedTimeRemaining(estimatedTimeRemaining)
    }, 1000)
    return () => {
      clearInterval(estimateInterval)
    }
  }, [props.state])

  return (
    <div className="capture-view">
      <div className="capture-video-container">
        <canvas
          width={560}
          height={320}
          style={{
            width: "35rem",
            height: "20rem",
            filter: "brightness(0.6) saturate(0.5)",
            display: props.videoURL && props.videoURL != "" ? "none" : "block",
          }}
          ref={props.canvasRef}
        ></canvas>
        {props.videoURL && props.videoURL != "" && (
          <video
            src={props.videoURL}
            style={{ height: "20rem" }}
            controls
          ></video>
        )}
        <div
          className="capture-video-overlay"
          style={{ display: props.state == "finished" ? "none" : "flex" }}
        >
          <div style={{ textAlign: "center" }}>
            {props.state == "failed"
              ? "Failed to export video! Check console for details."
              : props.state === "recording"
                ? "Recording..." +
                  (estimatedTimeRemaining >= 0
                    ? ` (est. ${formatSeconds(estimatedTimeRemaining)})`
                    : "")
                : `Encoding...`}
          </div>
          <div
            className="capture-progress-bar"
            style={{
              background: `linear-gradient(90deg, var(--accent-color) 0 ${props.progress * 100}%, var(--input-bg) ${props.progress * 100}% 100%)`,
            }}
          ></div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
          justifyContent: "center",
          marginTop: "1rem",
        }}
      >
        {props.state != "finished" && (
          <button
            className="delete"
            style={{ flex: "1" }}
            disabled={props.state !== "recording"}
            onClick={() => {
              if (props.capture.current) {
                props.capture.current.stop()
              }
            }}
          >
            Stop exporting
          </button>
        )}
        {(props.state == "finished" || props.state == "failed") && (
          <>
            <button
              style={{ flex: "1" }}
              onClick={() => {
                URL.revokeObjectURL(props.videoURL ?? "")
                props.setState("idle")
              }}
            >
              Export another video
            </button>
            <button
              className="confirm"
              disabled={props.state == "failed"}
              style={{ flex: "1" }}
              onClick={() => {
                if (props.videoURL) {
                  const link = document.createElement("a")
                  link.href = props.videoURL
                  const date = new Date()
                  link.download = `SME-${date.toISOString().slice(0, 10)}-${date.toTimeString().slice(0, 8).replaceAll(":", "-")}.mp4`
                  link.click()
                }
              }}
            >
              Download video
              {` (${formatBytes(props.videoSize ?? 0)})`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
