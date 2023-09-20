import bezier from "bezier-easing"
import { App } from "../../App"
import { BezierAnimator } from "../../util/BezierEasing"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"
import { Window } from "./Window"

const FREQUENCY_LINES = [
  { freq: 20, label: "20" },
  { freq: 30, label: "30" },
  { freq: 40, label: "40" },
  { freq: 50, label: "50" },
  { freq: 60, label: "60" },
  { freq: 70, label: "" },
  { freq: 80, label: "80" },
  { freq: 90, label: "" },
  { freq: 100, label: "100" },
  { freq: 200, label: "200" },
  { freq: 300, label: "300" },
  { freq: 400, label: "400" },
  { freq: 500, label: "500" },
  { freq: 600, label: "600" },
  { freq: 700, label: "" },
  { freq: 800, label: "800" },
  { freq: 900, label: "" },
  { freq: 1000, label: "1k" },
  { freq: 2000, label: "2k" },
  { freq: 3000, label: "3k" },
  { freq: 4000, label: "4k" },
  { freq: 5000, label: "5k" },
  { freq: 6000, label: "6k" },
  { freq: 7000, label: "" },
  { freq: 8000, label: "8k" },
  { freq: 9000, label: "" },
  { freq: 10000, label: "10k" },
  { freq: 15000, label: "" },
  { freq: 20000, label: "20k" },
]

const graphLeft = 0
const graphTop = 0
const graphWidth = 1200
const graphHeight = 400
const freqPool = new Array(graphWidth).fill(0).map((_, index) => xToFreq(index))
const freqPoolTyped = new Float32Array(freqPool)

function freqToX(frequency: number) {
  return (Math.log(frequency / 20) / Math.log(1102.5)) * graphWidth
}

function xToFreq(x: number) {
  return Math.pow(1102.5, x / graphWidth) * 20
}

function gainToY(gain: number) {
  return -gain * 6 + graphHeight / 2
}

function yToGain(y: number) {
  return -(y - graphHeight / 2) / 6
}

export class EQWindow extends Window {
  app: App
  private cachedReponse = new Array(graphWidth).fill(0)
  private onAudioLoad = this.onAudio.bind(this)
  private points: EQPoint[] = []

  constructor(app: App) {
    super({
      title: "Audio Equalizer",
      width: 600,
      height: 200,
      win_id: "audio-eq",
    })
    this.app = app
    this.initView()
    this.onAudioLoad()

    EventHandler.on("audioLoaded", this.onAudioLoad)
  }

  destroy() {
    EventHandler.off("audioLoaded", this.onAudioLoad)
  }

  initView() {
    this.viewElement.replaceChildren()
    const canvas = document.createElement("canvas")
    canvas.style.width = "600px"
    canvas.style.height = "200px"
    canvas.onmousedown = event =>
      this.points
        .filter(point => point.hitTest(event.offsetX * 2, event.offsetY * 2))
        .at(-1)
        ?.mouseDown(event)

    this.viewElement.appendChild(canvas)
    const frameDraw = this.drawEQ(canvas)
    requestAnimationFrame(frameDraw)
  }

  onAudio() {
    this.points = this.app.chartManager.chartAudio
      .getFilters()
      .map((_, index) => new EQPoint(this, index))
    this.getResponse()
  }

  getResponse() {
    this.cachedReponse =
      this.app.chartManager.chartAudio.getFrequencyResponse(freqPool)
  }

  drawEQ(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = 1200
    ctx.canvas.height = 400
    const call = () => {
      if (!this.app.chartManager.chartAudio) return
      ctx.fillStyle = "rgba(0, 0, 0, 1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgb(0, 50, 150)"
      this.drawFrequencies(
        ctx,
        this.app.chartManager.chartAudio.getFrequencyData()
      )
      ctx.fillStyle = "rgba(0, 150, 50, 0.3)"
      this.drawFrequencies(
        ctx,
        this.app.chartManager.chartAudio.getFilteredFrequencyData()
      )

      ctx.fillStyle = "rgba(200, 200, 200, 0.5)"
      this.drawResponse(ctx)
      ctx.fillStyle = "rgba(0, 100, 150, 0.5)"
      ctx.font = "22px Assistant"
      this.drawGrid(ctx)
      this.points.forEach(point => point.draw(ctx))
      if (canvas.closest("#windows")) requestAnimationFrame(call)
    }
    return call
  }

  drawFrequencies(ctx: CanvasRenderingContext2D, data: Uint8Array) {
    for (let x = 0; x < graphWidth; x++) {
      const bin =
        (xToFreq(x) / this.app.chartManager.chartAudio.getSampleRate()) *
        this.app.chartManager.chartAudio.getFFTSize()
      const y = data[Math.floor(bin)] / 255
      ctx.fillRect(
        graphLeft + x,
        graphTop + graphHeight - y * graphHeight,
        1,
        y * graphHeight
      )
    }
  }

  drawResponse(ctx: CanvasRenderingContext2D) {
    for (let x = 0; x < graphWidth; x++) {
      const gain = Math.log(this.cachedReponse[x]) / 0.115241
      const y = gainToY(gain)
      ctx.fillRect(
        x + graphLeft,
        Math.min(y, graphHeight / 2) + graphTop,
        1,
        Math.max(y, graphHeight / 2) - Math.min(y, graphHeight / 2)
      )
    }
  }

  drawGrid(ctx: CanvasRenderingContext2D) {
    for (const freqLine of FREQUENCY_LINES) {
      ctx.fillRect(graphLeft + freqToX(freqLine.freq), graphTop, 1, graphHeight)

      ctx.fillText(
        freqLine.label,
        graphLeft +
          freqToX(freqLine.freq) -
          (freqLine == FREQUENCY_LINES.at(-1) ? 20 : 0),
        graphTop + graphHeight / 2
      )
    }
    for (let i = -25; i <= 25; i += 5) {
      const y = graphTop + gainToY(i)
      ctx.fillRect(0, y, 1200, 1)
      if (i != 0) ctx.fillText(i + "", graphLeft, y)
    }
  }
}

const POINT_SIZE = 16

const fills = [
  "#a3001b",
  "#a34f00",
  "#d6d606",
  "#19c402",
  "#02c4ba",
  "#022fc4",
  "#5602c4",
  "#c402b4",
]

class EQPoint {
  private filterIndex
  private window
  private dragging = false
  private x = 0
  private y = 0
  private type
  private response = new Float32Array(freqPool.length)
  private _empty = new Float32Array(freqPool.length)
  pointSize = 0.4
  constructor(window: EQWindow, filterIndex: number) {
    this.filterIndex = filterIndex
    this.window = window
    this.type =
      this.window.app.chartManager.chartAudio.getFilter(filterIndex).type
    this.x = freqToX(
      this.window.app.chartManager.chartAudio.getFilter(filterIndex).frequency
        .value ?? 10
    )
    this.getY()
  }
  hitTest(x: number, y: number) {
    return (
      (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <=
      POINT_SIZE * POINT_SIZE
    )
  }
  canChangeGain() {
    return (
      this.type == "lowshelf" ||
      this.type == "highshelf" ||
      this.type == "peaking"
    )
  }
  getY() {
    if (this.type.endsWith("shelf")) {
      this.y = gainToY(
        this.window.app.chartManager.chartAudio.getFilter(this.filterIndex).gain
          .value / 2 ?? 0
      )
    } else if (this.canChangeGain()) {
      this.y = gainToY(
        this.window.app.chartManager.chartAudio.getFilter(this.filterIndex).gain
          .value ?? 0
      )
    } else {
      this.y = graphHeight / 2
    }
  }
  getGain() {
    if (!this.canChangeGain()) return undefined
    if (this.type.endsWith("shelf")) {
      return yToGain(this.y) * 2
    } else {
      return yToGain(this.y)
    }
  }
  mouseDown(event: MouseEvent) {
    this.calcResponse()
    this.dragging = true
    const xStart = this.x
    const yStart = this.y
    const xOffset = event.clientX
    const yOffset = event.clientY
    const mousemove = (event: MouseEvent) => {
      this.x = (event.clientX - xOffset) * 2 + xStart
      if (this.canChangeGain()) this.y = (event.clientY - yOffset) * 2 + yStart
      else this.y = graphHeight / 2
      this.x = clamp(this.x, 0, graphWidth)
      this.y = clamp(
        this.y,
        this.type.endsWith("shelf") ? graphHeight / 4 : 0,
        this.type.endsWith("shelf") ? (3 * graphHeight) / 4 : graphHeight
      )
      this.window.app.chartManager.chartAudio.updateFilter(this.filterIndex, {
        frequency: xToFreq(this.x),
        gain: this.getGain(),
      })
      this.window.getResponse()
      this.calcResponse()
    }
    const mouseup = () => {
      BezierAnimator.animate(
        this,
        {
          0: {
            pointSize: "inherit",
          },
          1: {
            pointSize: 0.3,
          },
        },
        0.3,
        bezier(0.11, 0.71, 0.41, 0.86),
        () => {},
        `eq-point${this.filterIndex}`
      )
      this.dragging = false
      window.removeEventListener("mousemove", mousemove)
      window.removeEventListener("mouseup", mouseup)
    }
    BezierAnimator.animate(
      this,
      {
        0: {
          pointSize: "inherit",
        },
        1: {
          pointSize: 0.9,
        },
      },
      0.3,
      bezier(0.11, 0.71, 0.41, 0.86),
      () => {},
      `eq-point${this.filterIndex}`
    )
    window.addEventListener("mousemove", mousemove)
    window.addEventListener("mouseup", mouseup)
  }
  calcResponse() {
    this.window.app.chartManager.chartAudio
      .getFilter(this.filterIndex)
      .getFrequencyResponse(freqPoolTyped, this.response, this._empty)
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = fills[this.filterIndex] + "60"
    if (this.dragging) {
      for (let x = 0; x < this.response.length; x++) {
        const gain = Math.log(this.response[x]) / 0.115241
        const y = gainToY(gain)
        ctx.fillRect(
          x + graphLeft,
          Math.min(y, graphHeight / 2) + graphTop,
          1,
          Math.max(y, graphHeight / 2) - Math.min(y, graphHeight / 2)
        )
      }
    }
    ctx.fillStyle = fills[this.filterIndex] + "80"
    ctx.beginPath()
    ctx.arc(this.x, this.y, POINT_SIZE, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.x, this.y, POINT_SIZE * this.pointSize, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
  }
}
