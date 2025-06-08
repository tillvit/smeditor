import { App } from "../../App"
import {
  CAPTURE_WINDOW_VIDEO_OPTIONS,
  CAPTURE_WINDOW_VIEW_OPTIONS,
  CaptureWindowOptions,
} from "../../data/CaptureWindowData"
import { Capture, CaptureOptions } from "../../util/Capture"
import { EventHandler } from "../../util/EventHandler"
import { Keybinds } from "../../util/Keybinds"
import { formatBytes, formatSeconds } from "../../util/Util"
import { Dropdown } from "../element/Dropdown"
import { NumberSpinner } from "../element/NumberSpinner"
import { createValueInput } from "../element/ValueInput"
import { Window } from "./Window"

export class CaptureWindow extends Window {
  app: App
  private captureOptions: Omit<CaptureOptions, "startTime" | "endTime"> = {
    aspectRatio: 4 / 3,
    videoHeight: 720,
    fps: 60,
    bitrate: 4e6,
    playbackRate: 1,
    assistTick: false,
    metronome: false,
    hideBarlines: false,
  }
  private startBeat = 0
  private endBeat = 1

  private presetDropdown!: Dropdown<string>
  private exportButton!: HTMLButtonElement

  private optionsView!: HTMLDivElement
  private captureView!: HTMLDivElement

  private captureCanvas!: HTMLCanvasElement
  private videoContainer!: HTMLDivElement
  private progressLabel!: HTMLDivElement
  private progressBar!: HTMLDivElement
  private currentCapture?: Capture
  private videoURL?: string

  private stopButton!: HTMLButtonElement
  private returnButton!: HTMLButtonElement
  private downloadButton!: HTMLButtonElement

  private estimateInterval?: NodeJS.Timeout

  private regionHandler!: (startBeat: number, endBeat: number) => void

  constructor(app: App) {
    super({
      title: "Export Recording",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "capture",
      blocking: false,
    })
    this.app = app
    if (
      this.app.chartManager.startRegion !== undefined &&
      this.app.chartManager.endRegion !== undefined
    ) {
      this.startBeat = this.app.chartManager.startRegion
      this.endBeat = this.app.chartManager.endRegion
    } else {
      this.startBeat = 0
      this.endBeat = this.app.chartManager.loadedChart!.getLastBeat()
    }

    this.initView()
  }

  onClose(): void {
    EventHandler.off("regionChanged", this.regionHandler)
    if (this.currentCapture) {
      this.currentCapture.stop()
    }
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    this.initOptionsView()
    this.initCaptureView()

    padding.replaceChildren(this.optionsView, this.captureView)

    if (!VideoEncoder || !AudioEncoder) {
      const errorMessage = document.createElement("div")
      errorMessage.classList.add("capture-error")
      const errorHeader = document.createElement("h3")
      errorHeader.innerText =
        "Your browser doesn't seem to support web encoding."
      const message = document.createElement("p")
      message.innerText =
        "Please try a different browser or use the desktop app."
      errorMessage.replaceChildren(errorHeader, message)
      this.optionsView.style.filter = "blur(10px)"
      this.optionsView.style.pointerEvents = "none"
      padding.appendChild(errorMessage)
      this.exportButton.disabled = true
    }

    this.viewElement.appendChild(padding)
  }

  initOptionsView() {
    const optionsView = document.createElement("div")
    optionsView.classList.add("capture-options-container")

    const videoViewOptions = document.createElement("div")
    videoViewOptions.style.display = "flex"
    videoViewOptions.style.flexDirection = "row"
    videoViewOptions.style.gap = "2rem"
    videoViewOptions.style.alignItems = "flex-start"

    const timeRangeContainer = document.createElement("div")
    timeRangeContainer.classList.add("capture-options")
    const timeRangeLabel = document.createElement("div")
    timeRangeLabel.classList.add("capture-options-label")
    timeRangeLabel.innerText = "Record Range"

    const { item: startInput, update: startUpdate } = this.buildBeatSecondInput(
      "Start",
      value => {
        this.startBeat = value
        if (this.startBeat > this.endBeat) {
          this.startBeat = this.endBeat
          startUpdate(this.startBeat)
        }
        this.updateSizeEstimate()
      }
    )
    const { item: endInput, update: endUpdate } = this.buildBeatSecondInput(
      "End",
      value => {
        this.endBeat = value
        if (this.endBeat < this.startBeat) {
          this.endBeat = this.startBeat
          endUpdate(this.endBeat)
        }
        this.updateSizeEstimate()
      }
    )
    startUpdate(this.startBeat)
    endUpdate(this.endBeat)
    const onRegionChange = (startBeat: number, endBeat: number) => {
      this.startBeat = startBeat
      this.endBeat = endBeat
      startUpdate(startBeat)
      endUpdate(endBeat)
    }
    this.regionHandler = onRegionChange.bind(this)
    EventHandler.on("regionChanged", this.regionHandler)

    timeRangeContainer.replaceChildren(timeRangeLabel, startInput, endInput)

    let videoOptions = this.buildOptions(
      "Video Options",
      CAPTURE_WINDOW_VIDEO_OPTIONS
    )
    const viewOptions = this.buildOptions(
      "View Options",
      CAPTURE_WINDOW_VIEW_OPTIONS
    )

    const presetContainer = document.createElement("div")
    presetContainer.classList.add("pref-item")
    const presetLabel = document.createElement("div")
    presetLabel.classList.add("pref-item-label", "label")
    presetLabel.innerText = "Quality Preset"

    this.presetDropdown = Dropdown.create(
      ["Minimal", "Low", "Medium", "High"],
      "Medium"
    )
    this.presetDropdown.onChange(value => {
      const rebuild = () => {
        const newContainer = this.buildOptions(
          "Video Options",
          CAPTURE_WINDOW_VIDEO_OPTIONS
        )
        newContainer.firstElementChild?.insertAdjacentElement(
          "afterend",
          presetContainer
        )
        videoOptions.replaceWith(newContainer)
        videoOptions = newContainer
        this.updateSizeEstimate()
      }
      switch (value) {
        case "Minimal":
          this.captureOptions = {
            ...this.captureOptions,
            videoHeight: 360,
            fps: 24,
            bitrate: 1e6,
          }
          rebuild()
          break
        case "Low":
          this.captureOptions = {
            ...this.captureOptions,
            videoHeight: 480,
            fps: 30,
            bitrate: 2.5e6,
          }
          rebuild()
          break
        case "Medium":
          this.captureOptions = {
            ...this.captureOptions,
            videoHeight: 720,
            fps: 60,
            bitrate: 4e6,
          }
          rebuild()
          break
        case "High":
          this.captureOptions = {
            ...this.captureOptions,
            videoHeight: 1080,
            fps: 60,
            bitrate: 8e6,
          }
          rebuild()
          break
      }
    })
    videoOptions.firstElementChild?.insertAdjacentElement(
      "afterend",
      presetContainer
    )
    presetContainer.replaceChildren(presetLabel, this.presetDropdown.view)

    videoViewOptions.replaceChildren(videoOptions, viewOptions)

    const exportButton = document.createElement("button")
    exportButton.innerText = "Export Recording"
    exportButton.classList.add("confirm")
    exportButton.onclick = async () => {
      this.startCapture()
    }
    this.exportButton = exportButton

    optionsView.replaceChildren(
      timeRangeContainer,
      videoViewOptions,
      exportButton
    )

    this.optionsView = optionsView
    this.updateSizeEstimate()
  }

  initCaptureView() {
    const captureView = document.createElement("div")
    captureView.classList.add("capture-view")

    const videoContainer = document.createElement("div")
    videoContainer.classList.add("capture-video-container")

    const canvas = document.createElement("canvas")
    canvas.width = 560
    canvas.height = 320
    canvas.style.width = "35rem"
    canvas.style.height = "20rem"
    canvas.style.filter = "brightness(0.6) saturate(0.5)"
    videoContainer.appendChild(canvas)

    const captureOverlay = document.createElement("div")
    captureOverlay.classList.add("capture-video-overlay")

    const progressLabel = document.createElement("div")
    progressLabel.innerText = "Rendering..."
    progressLabel.style.textAlign = "center"
    this.progressLabel = progressLabel

    captureOverlay.appendChild(progressLabel)

    const progressBar = document.createElement("div")
    progressBar.classList.add("capture-progress-bar")

    this.progressBar = progressBar

    captureOverlay.appendChild(progressBar)

    videoContainer.appendChild(captureOverlay)

    const videoButtonsContainer = document.createElement("div")
    videoButtonsContainer.style.display = "flex"
    videoButtonsContainer.style.flexDirection = "row"
    videoButtonsContainer.style.gap = "1rem"
    videoButtonsContainer.style.justifyContent = "center"
    videoButtonsContainer.style.marginTop = "1rem"

    const stopButton = document.createElement("button")
    stopButton.innerText = "Stop exporting"
    stopButton.classList.add("delete")
    stopButton.style.flex = "1"
    stopButton.onclick = () => {
      if (this.currentCapture) {
        this.currentCapture.stop()
        stopButton.disabled = true
      }
    }
    this.stopButton = stopButton

    const returnButton = document.createElement("button")
    returnButton.innerText = "Export another video"
    returnButton.style.flex = "1"
    returnButton.onclick = () => {
      this.captureView.style.display = "none"
      this.optionsView.style.display = ""
      this.videoContainer.childNodes.forEach(node => {
        ;(node as HTMLElement).style.display = ""
        if (node instanceof HTMLVideoElement) {
          URL.revokeObjectURL(node.src)
          node.pause()
          node.remove()
        }
      })
    }
    returnButton.style.display = "none"
    this.returnButton = returnButton

    const downloadButton = document.createElement("button")
    downloadButton.innerText = "Download video"
    downloadButton.style.flex = "1"
    downloadButton.classList.add("confirm")
    downloadButton.onclick = () => {
      if (this.videoURL) {
        const link = document.createElement("a")
        link.href = this.videoURL
        const date = new Date()
        link.download = `SME-${date.toISOString().slice(0, 10)}-${date.toTimeString().slice(0, 8).replaceAll(":", "-")}.mp4`
        link.click()
      }
    }
    downloadButton.style.display = "none"
    this.downloadButton = downloadButton

    videoButtonsContainer.replaceChildren(
      stopButton,
      returnButton,
      downloadButton
    )

    captureView.replaceChildren(videoContainer, videoButtonsContainer)

    this.captureCanvas = canvas
    this.videoContainer = videoContainer

    this.captureView = captureView
    captureView.style.display = "none"
  }

  startCapture() {
    Keybinds.disableKeybinds()
    this.stopButton.disabled = false
    this.stopButton.style.display = ""
    this.returnButton.style.display = "none"
    this.downloadButton.style.display = "none"
    this.setDisableClose(true)
    this.setBlocking(true)

    const ctx = this.captureCanvas.getContext("2d")

    const estimateQueue: number[] = []

    let estimatedTimeRemaining = -1
    let estimateLastFrame = 0

    this.estimateInterval = setInterval(() => {
      if (!this.currentCapture) {
        return
      }
      const currentFrame =
        this.currentCapture.currentRenderFrame -
        this.currentCapture.currentEncodeQueue
      estimateQueue.push(currentFrame - estimateLastFrame)
      estimateLastFrame = currentFrame
      if (estimateQueue.length > 20) {
        estimateQueue.shift()
      }
      const sum = estimateQueue.reduce((a, b) => a + b, 0)
      const average = sum / estimateQueue.length
      const remainingFrames = this.currentCapture.totalFrames - currentFrame
      estimatedTimeRemaining = Math.round(remainingFrames / average)
    }, 1000)

    this.captureView.style.display = ""
    this.optionsView.style.display = "none"
    try {
      const capture = new Capture(this.app, {
        ...this.captureOptions,
        startTime:
          this.app.chartManager.loadedChart!.getSecondsFromBeat(
            this.startBeat
          ) - 1,
        endTime:
          this.app.chartManager.loadedChart!.getSecondsFromBeat(this.endBeat) +
          1,
        updateCallback: data => {
          const completion =
            (data.currentRenderFrame - data.currentEncodeQueue) /
            data.totalFrames
          this.progressBar.style.background = `linear-gradient(90deg, var(--accent-color) 0 ${
            completion * 100
          }%, var(--input-bg) ${completion * 100}% 100%)`
          const state =
            data.currentRenderFrame == data.totalFrames
              ? "Encoding"
              : "Rendering"
          this.progressLabel.innerText = `${state}...`
          if (estimatedTimeRemaining >= 0 && state === "Rendering") {
            this.progressLabel.innerText += ` (est. ${formatSeconds(estimatedTimeRemaining)})`
          }

          if (!ctx || !data.currentVideoFrame) {
            return
          }
          ctx.clearRect(
            0,
            0,
            this.captureCanvas.width,
            this.captureCanvas.height
          )
          createImageBitmap(data.currentVideoFrame).then(bitmap => {
            const scaleRatio = bitmap.height / this.captureCanvas.height
            const scaledWidth = bitmap.width / scaleRatio
            const xPadding = (this.captureCanvas.width - scaledWidth) / 2
            ctx.drawImage(
              bitmap,
              0,
              0,
              bitmap.width,
              bitmap.height,
              xPadding,
              0,
              scaledWidth,
              this.captureCanvas.height
            )
          })
        },
        onFinish: url => {
          this.stopCapture(url)
        },
      })
      this.currentCapture = capture

      capture.start().catch(err => {
        console.error("Error starting capture:", err)
        this.stopCapture("")
      })
    } catch (err) {
      console.error("Error starting capture:", err)
      this.stopCapture("")
    }
  }

  stopCapture(url: string) {
    this.setDisableClose(false)
    this.setBlocking(false)
    Keybinds.enableKeybinds()
    this.videoURL = url
    this.stopButton.style.display = "none"
    this.returnButton.style.display = ""

    if (url != "") {
      this.downloadButton.style.display = ""
      this.downloadButton.innerText = `Download video (${formatBytes(this.currentCapture!.size)})`
    } else {
      this.progressLabel.innerText =
        "Failed to export video! Check console for details."
    }

    clearInterval(this.estimateInterval)
    this.currentCapture = undefined
    if (this.closed || url == "") return

    const video = document.createElement("video")
    video.src = url
    video.controls = true
    video.style.height = "20rem"

    this.videoContainer.childNodes.forEach(node => {
      ;(node as HTMLElement).style.display = "none"
    })

    this.videoContainer.appendChild(video)
  }

  private buildBeatSecondInput(
    label: string,
    onChange: (value: number) => void
  ) {
    const item = document.createElement("div")
    item.classList.add("pref-item")

    const labelElement = document.createElement("div")
    labelElement.classList.add("pref-item-label", "label")
    labelElement.innerText = label
    item.appendChild(labelElement)

    const inputContainer = document.createElement("div")

    const beatContainer = document.createElement("div")
    beatContainer.appendChild(document.createTextNode("Beat: "))
    const secondContainer = document.createElement("div")
    secondContainer.appendChild(document.createTextNode("Second: "))
    beatContainer.style.display = "flex"
    secondContainer.style.display = "flex"
    beatContainer.style.gap = "0.85rem"
    secondContainer.style.gap = "0.85rem"
    beatContainer.style.flexDirection = "row"
    secondContainer.style.flexDirection = "row"

    inputContainer.style.display = "flex"
    inputContainer.style.flexDirection = "row"
    inputContainer.style.gap = "1.5rem"

    const update = (newBeat: number) => {
      const second =
        this.app.chartManager.loadedChart!.getSecondsFromBeat(newBeat)
      secondInput.value = second
      beatInput.value = newBeat
    }

    const beatInput = NumberSpinner.create({
      value: 0,
      onchange: value => {
        if (value === undefined) {
          return
        }
        update(value)
        onChange(value)
      },
    })

    const secondInput = NumberSpinner.create({
      value: 0,
      onchange: value => {
        if (value === undefined) {
          return
        }
        update(this.app.chartManager.loadedChart!.getBeatFromSeconds(value))
        onChange(this.app.chartManager.loadedChart!.getBeatFromSeconds(value))
      },
    })

    inputContainer.replaceChildren(beatContainer, secondContainer)
    beatContainer.appendChild(beatInput.view)
    secondContainer.appendChild(secondInput.view)

    item.appendChild(inputContainer)

    return { item, update }
  }

  private updateSizeEstimate() {
    const bitrate = this.captureOptions.bitrate
    const videoLength =
      this.app.chartManager.loadedChart!.getSecondsFromBeat(this.endBeat) -
      this.app.chartManager.loadedChart!.getSecondsFromBeat(this.startBeat) +
      2
    const sizeEstimate = Math.round((bitrate * videoLength) / 8)
    this.exportButton.innerText = `Export Recording (Est. ${formatBytes(sizeEstimate)})`
  }

  private buildOptions(
    name: string,
    data: {
      [k in keyof CaptureOptions]?: CaptureWindowOptions<any>
    }
  ) {
    const container = document.createElement("div")
    container.classList.add("capture-options")
    const label = document.createElement("div")
    label.classList.add("capture-options-label")
    label.innerText = name
    container.appendChild(label)

    Object.entries(data).forEach(([name, option]) => {
      const item = document.createElement("div")
      item.classList.add("pref-item")

      const label = document.createElement("div")
      label.classList.add("pref-item-label", "label")

      label.innerText = option.label
      item.appendChild(label)

      const input = createValueInput(
        this.app,
        {
          ...option.input,
          onChange: (_: App, value: any) => {
            Object.assign(this.captureOptions, {
              [name as keyof CaptureOptions]: value,
            })
            if (["videoHeight", "fps", "bitrate"].includes(name)) {
              this.presetDropdown.setSelected("Custom")
            }
            this.updateSizeEstimate()
          },
        },
        this.captureOptions[
          name as keyof Omit<CaptureOptions, "startTime" | "endTime">
        ]
      )
      item.appendChild(input)

      container.appendChild(item)
    })
    return container
  }
}
