import bezier from "bezier-easing"
import { App } from "../../App"
import { BezierAnimator } from "../../util/BezierEasing"
import { EventHandler } from "../../util/EventHandler"
import { clamp, roundDigit } from "../../util/Math"
import { parseString as numericParse } from "../../util/Util"
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
  private icons!: HTMLDivElement
  private info!: HTMLDivElement
  private trackedFilter: number | null = null

  constructor(app: App) {
    super({
      title: "Audio Equalizer",
      width: 600,
      height: 245,
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

    const container = document.createElement("div")
    container.classList.add("eq-container")

    const iconContainer = document.createElement("div")
    iconContainer.classList.add("icon-container")
    this.app.chartManager.chartAudio.getFilters().forEach((filter, index) => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      icon.dataset.src = new URL(
        `../../../assets/svg/${filter.type}.svg`,
        import.meta.url
      ).href
      icon.classList.add("eq-icon")
      icon.setAttribute("fill", fills[index])
      icon.style.backgroundColor = `${fills[index]}40`
      icon.setAttribute("width", "36px")
      icon.setAttribute("height", "24px")
      icon.onclick = () => {
        const enabled =
          this.app.chartManager.chartAudio.getFilter(index).enabled
        if (enabled) this.app.chartManager.chartAudio.disableFilter(index)
        else this.app.chartManager.chartAudio.enableFilter(index)
        this.endTrack()
        this.updateIcons()
      }
      icon.onmouseenter = () => this.points[index].highlight()
      icon.onmouseleave = () => this.points[index].unhighlight()
      iconContainer.appendChild(icon)
    })
    this.icons = iconContainer
    this.updateIcons()

    const canvas = document.createElement("canvas")
    canvas.style.width = "600px"
    canvas.style.height = "200px"
    canvas.onmousedown = event => {
      const hitPoint = this.points
        .filter(point => point.hitTest(event.offsetX * 2, event.offsetY * 2))
        .at(-1)
      this.endTrack()
      hitPoint?.mouseDown(event)
    }

    const infoContainer = document.createElement("div")
    infoContainer.classList.add("eq-info-container")

    const typeContainer = document.createElement("div")
    typeContainer.classList.add("eq-info")
    const typeText = document.createElement("div")
    typeText.innerText = "Type"
    typeText.classList.add("eq-info-label")
    const typeValue = document.createElement("div")
    typeValue.classList.add("eq-info-value")
    typeContainer.replaceChildren(typeText, typeValue)

    const freqContainer = document.createElement("div")
    freqContainer.classList.add("eq-info")
    const freqText = document.createElement("div")
    freqText.innerText = "Frequency"
    freqText.classList.add("eq-info-label")
    const freqValue = document.createElement("div")
    freqValue.contentEditable = "false"
    freqValue.classList.add("eq-info-value", "inlineEdit")
    freqContainer.replaceChildren(freqText, freqValue)
    this.setupInput(freqValue, "frequency", 20, 22050, " Hz")

    const gainContainer = document.createElement("div")
    gainContainer.classList.add("eq-info")
    const gainText = document.createElement("div")
    gainText.innerText = "Gain"
    gainText.classList.add("eq-info-label")
    const gainValue = document.createElement("div")
    gainValue.contentEditable = "false"
    gainValue.classList.add("eq-info-value", "inlineEdit")
    gainContainer.replaceChildren(gainText, gainValue)
    this.setupInput(gainValue, "gain", -24, 24, " dB", 1)

    const qContainer = document.createElement("div")
    qContainer.classList.add("eq-info")
    const qText = document.createElement("div")
    qText.innerText = "Q"
    qText.classList.add("eq-info-label")
    const qValue = document.createElement("div")
    qValue.contentEditable = "false"
    qValue.classList.add("eq-info-value", "inlineEdit")
    qContainer.replaceChildren(qText, qValue)
    this.setupInput(qValue, "Q", 0.0001, 1000, "", 4)

    infoContainer.replaceChildren(
      typeContainer,
      freqContainer,
      gainContainer,
      qContainer
    )
    this.info = infoContainer

    container.replaceChildren(iconContainer, canvas, infoContainer)
    this.viewElement.appendChild(container)
    const frameDraw = this.drawEQ(canvas)
    requestAnimationFrame(frameDraw)
  }

  private selectText(element: HTMLElement) {
    const sel = window.getSelection()
    const range = document.createRange()
    if (!sel || !range) return
    range.selectNodeContents(element)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  private setupInput(
    element: HTMLDivElement,
    prop: "Q" | "gain" | "frequency",
    min: number,
    max: number,
    suffix = "",
    precision = 0
  ) {
    let lastValue = 0
    element.onfocus = () => {
      lastValue = this.app.chartManager.chartAudio.getFilter(
        this.trackedFilter!
      )[prop].value
      element.innerText = roundDigit(lastValue, precision) + ""
      this.selectText(element)
    }
    element.onkeydown = ev => {
      if (ev.key == "Enter") {
        element.blur()
        return
      }
      if (ev.key == "Tab") {
        const parent = element.parentElement!.parentElement!
        const inputContainers = [...parent.children]
        const currentContainer = inputContainers.indexOf(element.parentElement!)
        for (let i = 1; i < inputContainers.length; i++) {
          const container =
            inputContainers[(i + currentContainer) % inputContainers.length]
          const input = container.children[1] as HTMLDivElement
          if (input.contentEditable === "true") {
            input.focus()
            break
          }
        }
        return
      }
      if (ev.key == "Escape") {
        element.innerText = lastValue + suffix
        this.app.chartManager.chartAudio.updateFilter(this.trackedFilter!, {
          gain: clamp(lastValue, min, max),
        })
        this.points[this.trackedFilter!].refreshPoint()
        this.getResponse()
        element.blur()
        return
      }
      // wait until the value has changed
      setTimeout(() => {
        const value = numericParse(element.innerText)
        if (value === null) {
          return
        }
        this.app.chartManager.chartAudio.updateFilter(this.trackedFilter!, {
          [prop]: clamp(value, min, max),
        })
        this.points[this.trackedFilter!].refreshPoint()
        this.getResponse()
      })
    }

    element.onblur = () => {
      const value = numericParse(element.innerText)
      if (value === null) {
        this.app.chartManager.chartAudio.updateFilter(this.trackedFilter!, {
          [prop]: clamp(lastValue, min, max),
        })
        this.points[this.trackedFilter!].refreshPoint()
        this.getResponse()
      }
      element.innerText =
        roundDigit(
          this.app.chartManager.chartAudio.getFilter(this.trackedFilter!)[prop]
            .value,
          precision
        ) + suffix
    }
  }

  onAudio() {
    this.points = this.app.chartManager.chartAudio
      .getFilters()
      .map((_, index) => new EQPoint(this, index))
    this.getResponse()
    this.updateIcons()
    this.endTrack()
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
      ctx.fillStyle = "rgb(11, 14, 26)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgb(0, 50, 150)"
      this.drawFrequencies(
        ctx,
        this.app.chartManager.chartAudio.getFrequencyData()
      )
      if (this.app.chartManager.chartAudio.hasFilters()) {
        ctx.fillStyle = "rgba(200, 200, 200, 0.2)"
        this.drawFrequencies(
          ctx,
          this.app.chartManager.chartAudio.getFilteredFrequencyData()
        )
      }

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

  updateIcons() {
    ;[...this.icons.children].forEach((icon, index) => {
      if (this.app.chartManager.chartAudio.getFilter(index).enabled)
        icon.classList.remove("disabled")
      else icon.classList.add("disabled")
    })
    this.getResponse()
  }

  trackFilter(index: number) {
    this.trackedFilter = index
    const filter = this.app.chartManager.chartAudio.getFilter(index)
    const [typeText, freqText, gainText, qText] = [...this.info.children].map(
      container => container.children[1]
    ) as HTMLElement[]
    typeText.innerText = filter.type
    freqText.innerText = Math.round(filter.frequency.value) + " Hz"
    gainText.innerText = filter.type.endsWith("pass")
      ? "-"
      : roundDigit(filter.gain.value, 1) + " dB"
    qText.innerText = filter.type.endsWith("shelf")
      ? "-"
      : roundDigit(filter.Q.value, 2) + ""
    typeText.style.color = fills[index]
    freqText.style.color = fills[index]
    gainText.style.color = fills[index]
    qText.style.color = fills[index]
    freqText.contentEditable = "true"
    gainText.contentEditable = `${!filter.type.endsWith("pass")}`
    qText.contentEditable = `${!filter.type.endsWith("shelf")}`
  }

  endTrack() {
    setTimeout(() => {
      this.trackedFilter = null
      this.points.forEach(point => point.unhighlight())
      const [typeText, freqText, gainText, qText] = [...this.info.children].map(
        container => container.children[1]
      ) as HTMLElement[]
      typeText.innerText = ""
      freqText.innerText = ""
      gainText.innerText = ""
      qText.innerText = ""
      freqText.contentEditable = "false"
      gainText.contentEditable = "false"
      qText.contentEditable = "false"
    })
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
  private readonly filterIndex
  private window
  private dragging = false
  private x = 0
  private y = 0
  private readonly type
  private response = new Float32Array(freqPool.length)
  private _empty = new Float32Array(freqPool.length)
  private highlighted = false
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
  canChangeQ() {
    return !this.type.endsWith("shelf")
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
    this.highlighted = true
    if (
      !this.window.app.chartManager.chartAudio.getFilter(this.filterIndex)
        .enabled
    ) {
      this.window.app.chartManager.chartAudio.enableFilter(this.filterIndex)
      this.window.updateIcons()
    }
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
        this.type.endsWith("shelf") ? graphHeight / 4 : gainToY(24),
        this.type.endsWith("shelf") ? (3 * graphHeight) / 4 : gainToY(-24)
      )
      this.window.app.chartManager.chartAudio.updateFilter(this.filterIndex, {
        frequency: xToFreq(this.x),
        gain: this.getGain(),
      })
      this.window.getResponse()
      this.window.trackFilter(this.filterIndex)
      this.calcResponse()
    }
    this.window.trackFilter(this.filterIndex)
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
    const fill =
      this.highlighted ||
      this.window.app.chartManager.chartAudio.getFilter(this.filterIndex)
        .enabled
        ? fills[this.filterIndex]
        : "#888888"
    ctx.fillStyle = fill + "60"
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
      this.window.app.chartManager.chartAudio.getFilter(this.filterIndex)
        .frequency.value ?? 10
    )
    this.getY()
  }

  highlight() {
    this.highlighted = true
  }

  unhighlight() {
    this.highlighted = false
  }
}
