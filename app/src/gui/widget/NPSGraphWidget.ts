import { BitmapText, FederatedPointerEvent, Graphics, Texture } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { clamp, lerp, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { BaseTimelineWidget } from "./BaseTimelineWidget"
import { WidgetManager } from "./WidgetManager"

export class NPSGraphWidget extends BaseTimelineWidget {
  npsGraph: Graphics
  private graphGradient: Texture | null = null
  private graphWidth: number = 40
  private npsText: BitmapText = new BitmapText("", {
    fontName: "Main",
    fontSize: 12,
  })

  constructor(manager: WidgetManager) {
    const graphWidth = 40
    super(manager, 60, graphWidth)
    this.graphWidth = graphWidth

    this.graphGradient = this.makeGradient()

    this.npsGraph = new Graphics()
    this.container.addChild(this.npsGraph)

    this.npsText.visible = false
    this.npsText.anchor.x = 1
    this.npsText.anchor.y = 0.5
    this.addChild(this.npsText)

    EventHandler.on("userOptionUpdated", optionId => {
      if (
        optionId == "chart.npsGraph.color1" ||
        optionId == "chart.npsGraph.color2"
      ) {
        this.graphGradient = this.makeGradient()
        this.populate()
      }
    })

    this.on("mouseleave", () => {
      this.hideNpsDisplay()
    })

    this.on("mouseenter", () => {
      this.showNpsDisplay()
    })

    this.on("mousemove", event => {
      this.updateNpsDisplay(event)
    })

    this.populate()
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
    const npsGraphData = chart.getNPSGraph()

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
    const nps = npsGraphData[npsIndex] ?? 0

    this.npsText.text = nps.toFixed(1) + " nps"
    this.npsText.position.y = this.getYFromBeat(beat) - this.npsGraph.height / 2
    this.npsText.position.x = -this.backing.width / 2 - 10
    this.npsText.visible = true
  }

  private hideNpsDisplay() {
    this.npsText.visible = false
  }

  private showNpsDisplay() {
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
    this.npsText.visible = true
  }

  update() {
    if (!Options.chart.npsGraph.enabled) {
      this.visible = false
      return
    }
    super.update()
  }

  populate() {
    const chart = this.getChart()
    if (!chart) {
      return
    }

    const height = this.manager.app.renderer.screen.height - 40

    if (chart.getNotedata().length == 0) {
      return
    }

    const maxNps = chart.getMaxNPS()
    const npsGraphData = chart.getNPSGraph()
    const lastBeat = chart.getLastBeat()

    this.npsGraph.clear()
    if (this.graphGradient) {
      this.npsGraph.beginTextureFill({ texture: this.graphGradient })
    } else {
      this.npsGraph.beginFill(0x000000, 1)
    }

    this.npsGraph.pivot.x = this.backing.width / 2
    this.npsGraph.pivot.y = height / 2

    const lastMeasure = npsGraphData.length

    const startY = this.getYFromBeat(0)
    this.npsGraph.moveTo(0, startY)

    for (let measureIndex = 0; measureIndex < lastMeasure; measureIndex++) {
      const nps = npsGraphData[measureIndex] ?? 0
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

    const lastnps = npsGraphData.at(-1) ?? 0
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
