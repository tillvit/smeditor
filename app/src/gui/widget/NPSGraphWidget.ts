import {
  BitmapText,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { Chart } from "../../chart/sm/Chart"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { Flags } from "../../util/Flags"
import { clamp, lerp, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class NPSGraphWidget extends Widget {
  backing: BetterRoundedRect = new BetterRoundedRect()
  overlay: Sprite = new Sprite(Texture.WHITE)
  npsGraph: Graphics

  private lastHeight = 0
  private lastCMod
  private mouseDown = false
  private queued = false
  private graphGradient: Texture | null = null

  private graphWidth: number = 40
  private npsText: BitmapText = new BitmapText("npsText", {
    fontName: "Main",
    fontSize: 12,
  })

  constructor(manager: WidgetManager) {
    super(manager)
    this.graphGradient = this.makeGradient()
    this.addChild(this.backing)
    this.visible = false
    this.backing.tint = 0
    this.backing.alpha = 0.3

    this.npsGraph = new Graphics()
    this.addChild(this.npsGraph)

    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.lastCMod = Options.chart.CMod
    this.addChild(this.overlay)
    this.x = this.manager.app.renderer.screen.width / 2 - 20

    this.npsText.visible = false
    this.npsText.anchor.x = 1
    this.npsText.anchor.y = 0.5
    this.addChild(this.npsText)

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    EventHandler.on("chartLoaded", () => {
      this.queued = false
      this.populate()
    })
    EventHandler.on("chartModifiedAfter", () => {
      if (!this.queued) this.populate()
      this.queued = true
    })
    const interval = setInterval(() => {
      if (this.queued) {
        this.queued = false
        this.populate()
      }
    }, 3000)

    EventHandler.on("userOptionUpdated", optionId => {
      if (
        optionId == "chart.npsGraph.color1" ||
        optionId == "chart.npsGraph.color2"
      ) {
        this.graphGradient = this.makeGradient()
        this.populate()
      }
    })
    this.on("destroyed", () => clearInterval(interval))
    this.populate()

    this.eventMode = "static"
    this.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.on("mousemove", event => {
      this.handleMouse(event)
    })
    this.on("mouseleave", () => {
      this.mouseDown = false
      this.clearNpsDisplay()
    })
    window.onmouseup = () => {
      this.mouseDown = false
    }
  }

  private handleMouse(event: FederatedPointerEvent) {
    if (this.mouseDown) {
      this.handleUpdateChartPosition(event)
    }
    this.updateNpsDisplay(event)
  }

  private handleUpdateChartPosition(event: FederatedPointerEvent) {
    if (this.manager.chartManager.getMode() == EditMode.Play) return
    if (!this.getChart()) return
    let t = this.npsGraph.toLocal(event.global).y / this.npsGraph.height
    t = clamp(t, 0, 1)
    if (Options.chart.CMod) {
      this.manager.chartManager.setTime(
        lerp(
          -this.getChart().timingData.getOffset(),
          this.getChart().getLastSecond(),
          t
        )
      )
    } else {
      this.manager.chartManager.setBeat(this.getChart().getLastBeat() * t)
    }
  }

  private updateNpsDisplay(event: FederatedPointerEvent) {
    const chart = this.getChart()
    if (!chart) {
      this.npsText.visible = false
      return
    }
    const lastNote = chart.getNotedata().at(-1)
    if (!lastNote) {
      this.npsText.visible = false
      return
    }
    const npsGraph = chart.getNPSGraph()

    let t = this.npsGraph.toLocal(event.global).y / this.npsGraph.height
    t = clamp(t, 0, 1)

    let beat = lerp(0, chart.getLastBeat(), t)
    if (Options.chart.CMod) {
      const second = lerp(
        -chart.timingData.getOffset(),
        chart.getLastSecond(),
        t
      )
      beat = chart.timingData.getBeatFromSeconds(second)
    }

    const npsIndex = Math.floor(chart.timingData.getMeasure(beat))

    // npsGraph is a sparse array, so make sure we have a valid number,
    // otherwise the nps for that measure is 0
    const nps = npsGraph[npsIndex] ?? 0

    this.npsText.text = nps.toFixed(1) + " nps"
    this.npsText.position.y = this.getYFromBeat(beat) - this.npsGraph.height / 2
    this.npsText.position.x = -this.backing.width / 2 - 10
    this.npsText.visible = true
  }

  private clearNpsDisplay() {
    this.npsText.visible = false
  }

  update() {
    if (!Options.chart.npsGraph.enabled) {
      this.visible = false
      return
    }

    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    if (!chart || !chartView || !Flags.layout) {
      this.visible = false
      return
    }
    this.visible = true

    this.scale.y = Options.chart.reverse ? -1 : 1
    const height = this.manager.app.renderer.screen.height - 40
    this.backing.height = height + 10
    this.backing.position.y = -this.backing.height / 2
    this.backing.position.x = -this.backing.width / 2

    this.x = this.manager.app.renderer.screen.width / 2 - 60

    if (chart.getNotedata().length == 0) {
      this.overlay.height = 0
      return
    }

    let startY, endY: number
    if (Options.chart.CMod) {
      startY = this.getYFromSecond(
        chartView.getSecondFromYPos(
          -this.manager.app.renderer.screen.height / 2
        )
      )
      endY = this.getYFromSecond(
        chartView.getSecondFromYPos(this.manager.app.renderer.screen.height / 2)
      )
    } else {
      startY = this.getYFromBeat(
        chartView.getBeatFromYPos(
          -this.manager.app.renderer.screen.height / 2,
          true
        )
      )
      endY = this.getYFromBeat(
        chartView.getBeatFromYPos(
          this.manager.app.renderer.screen.height / 2,
          true
        )
      )
    }

    if (startY > endY) [startY, endY] = [endY, startY]
    this.overlay.y = startY - this.npsGraph.height / 2
    this.overlay.height = endY - startY
    this.overlay.height = Math.max(2, this.overlay.height)
    if (
      this.manager.app.renderer.screen.height != this.lastHeight ||
      this.lastCMod != Options.chart.CMod
    ) {
      this.lastCMod = Options.chart.CMod
      this.lastHeight = this.manager.app.renderer.screen.height
      this.populate()
    }
  }

  populate() {
    const chart = this.getChart()
    if (!chart) {
      return
    }

    const height = this.manager.app.renderer.screen.height - 40
    this.backing.width = this.graphWidth + 8
    this.overlay.width = this.graphWidth + 8
    this.pivot.x = this.backing.width / 2

    if (chart.getNotedata().length == 0) {
      return
    }

    const maxNps = chart.getMaxNPS()
    const npsGraph = chart.getNPSGraph()
    const lastBeat = chart.getLastBeat()

    this.npsGraph.clear()
    if (this.graphGradient) {
      this.npsGraph.beginTextureFill({ texture: this.graphGradient })
    } else {
      this.npsGraph.beginFill(0x000000, 1)
    }

    this.npsGraph.pivot.x = this.backing.width / 2
    this.npsGraph.pivot.y = height / 2

    const lastMeasure = npsGraph.length

    const startY = this.getYFromBeat(0)
    this.npsGraph.moveTo(0, startY)

    for (let measureIndex = 0; measureIndex < lastMeasure; measureIndex++) {
      const nps = npsGraph[measureIndex] || 0
      const beat = chart.timingData.getBeatFromMeasure(measureIndex)
      const endOfMeasureBeat = Math.min(
        lastBeat,
        chart.timingData.getBeatFromMeasure(measureIndex + 1)
      )
      const x = unlerp(0, maxNps, nps) * this.graphWidth
      const y = this.getYFromBeat(beat)
      const endOfMeasureY = this.getYFromBeat(endOfMeasureBeat)

      this.npsGraph.lineTo(x, y)
      this.npsGraph.lineTo(x, endOfMeasureY)
    }

    const lastnps = npsGraph.at(-1)!
    const lastX = unlerp(0, maxNps, lastnps) * this.graphWidth
    const lastY = this.getYFromBeat(lastBeat)
    this.npsGraph.lineTo(lastX, lastY)
    this.npsGraph.lineTo(0, lastY)
    this.npsGraph.endFill()
  }

  private getYFromBeat(beat: number): number {
    if (Options.chart.CMod) {
      return this.getYFromSecond(
        this.getChart().timingData.getSecondsFromBeat(beat)
      )
    }
    let t = unlerp(0, this.getChart().getLastBeat(), beat)
    t = clamp(t, 0, 1)
    return t * (this.backing.height - 10)
  }

  private getYFromSecond(second: number): number {
    if (!Options.chart.CMod) {
      return this.getYFromBeat(
        this.getChart().timingData.getBeatFromSeconds(second)
      )
    }
    let t = unlerp(
      -this.getChart().timingData.getOffset(),
      this.getChart().getLastSecond(),
      second
    )
    t = clamp(t, 0, 1)
    return t * (this.backing.height - 10)
  }

  private getChart(): Chart {
    return this.manager.chartManager.loadedChart!
  }

  private makeGradient() {
    const quality = this.graphWidth
    const canvas = document.createElement("canvas")

    canvas.width = quality
    canvas.height = quality

    const ctx = canvas.getContext("2d")

    if (ctx == null) {
      return null
    }
    // use canvas2d API to create gradient
    const grd = ctx.createLinearGradient(0, 0, quality, 0)

    const color1 = `#${Options.chart.npsGraph.color1.toString(16)}`
    const color2 = `#${Options.chart.npsGraph.color2.toString(16)}`
    grd.addColorStop(0, color1)
    grd.addColorStop(0.8, color2)

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, quality, quality)

    return Texture.from(canvas)
  }
}
