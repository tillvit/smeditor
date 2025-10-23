import bezier from "bezier-easing"
import { ChartAudio } from "../../../chart/audio/ChartAudio"
import { BezierAnimator } from "../../../util/BezierEasing"
import { clamp } from "../../../util/Math"
import {
  EQFills,
  EQFreqPool,
  EQFreqPoolTyped,
  EQGraphHeight,
  EQGraphLeft,
  EQGraphTop,
  EQGraphWidth,
  freqToX,
  gainToY,
  xToFreq,
  yToGain,
} from "./EQWindow"

const POINT_SIZE = 16

export class EQPoint {
  readonly filterIndex
  private audio
  private x = 0
  private y = 0
  private readonly type
  private response = new Float32Array(EQFreqPool.length)
  private _empty = new Float32Array(EQFreqPool.length)
  private highlighted = false
  private dragging = false
  private fetchData
  pointSize = 0.4
  constructor(
    audio: ChartAudio,
    filterIndex: number,
    fetchData: (index: number | null) => void
  ) {
    this.filterIndex = filterIndex
    this.fetchData = fetchData
    this.audio = audio
    this.type = this.audio.getFilter(filterIndex).type
    this.x = freqToX(this.audio.getFilter(filterIndex).frequency.value ?? 10)
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
  canChangeQ() {
    return !this.type.endsWith("shelf")
  }
  getY() {
    if (this.type.endsWith("shelf")) {
      this.y = gainToY(
        (this.audio.getFilter(this.filterIndex).gain.value ?? 0) / 2
      )
    } else if (this.canChangeGain()) {
      this.y = gainToY(this.audio.getFilter(this.filterIndex).gain.value ?? 0)
    } else {
      this.y = EQGraphHeight / 2
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
    this.highlighted = true
    this.dragging = true
    if (!this.audio.getFilter(this.filterIndex).enabled) {
      this.audio.enableFilter(this.filterIndex)
    }
    const xStart = this.x
    const yStart = this.y
    const xOffset = event.clientX
    const yOffset = event.clientY
    const mousemove = (event: MouseEvent) => {
      this.x = (event.clientX - xOffset) * 2 + xStart
      if (this.canChangeGain()) this.y = (event.clientY - yOffset) * 2 + yStart
      else this.y = EQGraphHeight / 2
      this.x = clamp(this.x, 0, EQGraphWidth)
      this.y = clamp(
        this.y,
        this.type.endsWith("shelf") ? EQGraphHeight / 4 : gainToY(24),
        this.type.endsWith("shelf") ? (3 * EQGraphHeight) / 4 : gainToY(-24)
      )
      this.audio.updateFilter(this.filterIndex, {
        frequency: xToFreq(this.x),
        gain: this.getGain(),
      })
      this.calcResponse()
      this.fetchData(this.filterIndex)
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
    this.audio
      .getFilter(this.filterIndex)
      .getFrequencyResponse(EQFreqPoolTyped, this.response, this._empty)
  }
  draw(ctx: CanvasRenderingContext2D) {
    const fill =
      this.highlighted ||
      this.dragging ||
      this.audio.getFilter(this.filterIndex).enabled
        ? EQFills[this.filterIndex]
        : "#888888"
    ctx.fillStyle = fill + "60"
    if (this.highlighted || this.dragging) {
      for (let x = 0; x < this.response.length; x++) {
        const gain = Math.log(this.response[x]) / 0.115241
        const y = gainToY(gain)
        ctx.fillRect(
          x + EQGraphLeft,
          Math.min(y, EQGraphHeight / 2) + EQGraphTop,
          1,
          Math.max(y, EQGraphHeight / 2) - Math.min(y, EQGraphHeight / 2)
        )
      }
    }
    ctx.fillStyle = fill + "80"
    ctx.beginPath()
    ctx.arc(this.x, this.y, POINT_SIZE, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.x, this.y, POINT_SIZE * this.pointSize, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
  }

  refreshPoint() {
    this.x = freqToX(
      this.audio.getFilter(this.filterIndex).frequency.value ?? 10
    )
    this.calcResponse()
    this.getY()
  }

  highlight() {
    this.highlighted = true
  }

  unhighlight() {
    this.highlighted = false
  }
}
