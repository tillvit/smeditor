import { useContext, useRef, useState } from "react"
import { Capture, CaptureOptions } from "../../../util/Capture"
import { Keybinds } from "../../../util/Keybinds"
import { WindowContext, WindowData } from "../WindowManager"
import { CaptureOptionsView } from "./CaptureOptionView"
import { CaptureRecordingView } from "./CaptureRecordingView"

export type CaptureState =
  | "idle"
  | "recording"
  | "encoding"
  | "finished"
  | "failed"

function CaptureWindowContent() {
  const windowData = useContext(WindowContext)!
  const [captureOptions, setCaptureOptions] = useState<
    Omit<CaptureOptions, "startTime" | "endTime">
  >({
    aspectRatio: 4 / 3,
    videoHeight: 720,
    fps: 60,
    bitrate: 4e6,
    playbackRate: 1,
    assistTick: false,
    metronome: false,
    hideBarlines: false,
  })
  const [startBeat, setStartBeat] = useState(0)
  const [endBeat, setEndBeat] = useState(
    windowData.app.chartManager.loadedChart!.getLastBeat()
  )
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [videoSize, setVideoSize] = useState<number | null>(null)
  const [state, setState] = useState<CaptureState>("idle")
  const capture = useRef<Capture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [progress, setProgress] = useState(0)

  function startRecording() {
    setState("recording")
    setProgress(0)
    setVideoSize(null)
    setVideoURL(null)
    Keybinds.disableKeybinds()
    windowData.setDisableClose(true)
    windowData.setBlocking(true)

    try {
      capture.current = new Capture(windowData.app, {
        ...captureOptions,
        startTime:
          windowData.app.chartManager.loadedChart!.getSecondsFromBeat(
            startBeat
          ) - 1,
        endTime:
          windowData.app.chartManager.loadedChart!.getSecondsFromBeat(endBeat) +
          1,
        updateCallback: async data => {
          setState(
            data.currentRenderFrame < data.totalFrames
              ? "recording"
              : "encoding"
          )
          const completion =
            (data.currentRenderFrame - data.currentEncodeQueue) /
            data.totalFrames
          setProgress(completion)

          const ctx = canvasRef.current?.getContext("2d")
          if (!ctx || !data.currentVideoFrame) {
            return
          }
          ctx.clearRect(
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
          )
          const bitmap = await createImageBitmap(data.currentVideoFrame)
          const scaleRatio = bitmap.height / canvasRef.current!.height
          const scaledWidth = bitmap.width / scaleRatio
          const xPadding = (canvasRef.current!.width - scaledWidth) / 2
          ctx.drawImage(
            bitmap,
            0,
            0,
            bitmap.width,
            bitmap.height,
            xPadding,
            0,
            scaledWidth,
            canvasRef.current!.height
          )
        },
        onFinish: url => {
          stopCapture(url)
        },
      })

      capture.current.start().catch(err => {
        console.error("Error starting capture:", err)
        stopCapture("")
      })
    } catch (err) {
      console.error("Error starting capture:", err)
      stopCapture("")
    }
  }

  function stopCapture(url: string) {
    if (!capture.current) return
    setState("finished")
    windowData.setDisableClose(false)
    windowData.setBlocking(false)
    Keybinds.enableKeybinds()
    setVideoURL(url)

    if (url == "") setState("failed")

    setVideoSize(capture.current.size)
    capture.current = null
  }

  return (
    <div className="flex-column-full">
      {state !== "idle" ? (
        <CaptureRecordingView
          capture={capture}
          state={state}
          setState={setState}
          videoURL={videoURL}
          videoSize={videoSize}
          canvasRef={canvasRef}
          progress={progress}
        />
      ) : (
        <CaptureOptionsView
          captureOptions={captureOptions}
          setCaptureOptions={setCaptureOptions}
          startBeat={startBeat}
          setStartBeat={setStartBeat}
          endBeat={endBeat}
          setEndBeat={setEndBeat}
          startRecording={startRecording}
        />
      )}
      {(!VideoEncoder || !AudioEncoder) && (
        <div className="capture-error">
          <h3>Your browser doesn't seem to support web encoding.</h3>
          <p>Please try a different browser or use the desktop app.</p>
        </div>
      )}
    </div>
  )
}

export function CaptureWindow(): WindowData {
  return {
    id: "capture",
    title: "Export Recording",
    width: 600,
    height: 400,
    content: <CaptureWindowContent />,
  }
}
