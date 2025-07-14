import { BitmapText, FederatedPointerEvent, Graphics, Texture } from "pixi.js"
import { assignTint, colorFallback } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { clamp, unlerp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { WidgetManager } from "../WidgetManager"
import { BaseTimelineWidget } from "./BaseTimelineWidget"

export class DensityWidget extends BaseTimelineWidget {
  npsGraph: Graphics
  private graphGradient: Texture | null = null
  private graphWidth: number = 40
  private npsText: BitmapText = new BitmapText("", {
    fontName: "Main",
    fontSize: 12,
  })

  constructor(manager: WidgetManager) {
    const graphWidth = 40
    super(manager, {
      backingWidth: 60,
      order: 9,
    })
    this.graphWidth = graphWidth

    this.graphGradient = this.makeGradient()

    this.npsGraph = new Graphics()
    this.container.addChild(this.npsGraph)

    this.name = "density"

    this.npsText.visible = false
    this.npsText.anchor.x = 1
    this.npsText.anchor.y = 0.5
    assignTint(this.npsText, "text-color")
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
    const npsGraphData = chart.stats.npsGraph
    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin

    let t = this.npsGraph.toLocal(event.global).y / height
    t = clamp(t, 0, 1)

    const position = this.getSongPositionFromT(t)
    const npsIndex = Math.floor(chart.timingData.getMeasure(position.beat))

    // npsGraph is a sparse array, so make sure we have a valid number,
    // otherwise the nps for that measure is 0
    const nps = npsGraphData[npsIndex] ?? 0

    this.npsText.text = nps.toFixed(1) + " nps"
    this.npsText.position.y = this.npsGraph.toLocal(event.global).y - height / 2
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
    this.visible = true
    this.npsText.scale.y = Options.chart.reverse ? -1 : 1

    super.update()
  }

  populate(startBeat?: number, endBeat?: number) {
    const chart = this.getChart()
    if (!chart) {
      return
    }

    const maxNps = chart.stats.getMaxNPS()
    const npsGraphData = chart.stats.npsGraph
    const lastBeat = chart.getLastBeat()

    this.npsGraph.clear()

    if (chart.getNotedata().length == 0) {
      return
    }

    if (this.graphGradient) {
      this.npsGraph.beginTextureFill({ texture: this.graphGradient })
    } else {
      this.npsGraph.beginFill(0x000000, 1)
    }

    this.npsGraph.pivot.x = this.backing.width / 2
    this.npsGraph.pivot.y =
      (this.manager.app.STAGE_HEIGHT - this.verticalMargin) / 2

    const lastMeasure = Math.floor(
      this.getChart().timingData.getMeasure(lastBeat)
    )

    const startY = this.getYFromBeat(this.getSongPositionFromT(0).beat)
    const endY = this.getYFromBeat(this.getSongPositionFromT(1).beat)
    this.npsGraph.moveTo(0, startY)

    for (let measureIndex = 0; measureIndex <= lastMeasure; measureIndex++) {
      const nps = npsGraphData[measureIndex] ?? 0
      const beat = chart.timingData.getBeatFromMeasure(measureIndex)
      const endOfMeasureBeat = Math.min(
        lastBeat,
        chart.timingData.getBeatFromMeasure(measureIndex + 1)
      )
      if (startBeat !== undefined && endOfMeasureBeat < startBeat) continue
      if (endBeat !== undefined && beat > endBeat) break
      const x = unlerp(0, maxNps, nps) * this.graphWidth
      const y = clamp(this.getYFromBeat(beat), startY, endY)
      const endOfMeasureY = clamp(
        this.getYFromBeat(endOfMeasureBeat),
        startY,
        endY
      )

      this.npsGraph.lineTo(x, y)
      this.npsGraph.lineTo(x, endOfMeasureY)
    }

    const lastnps = npsGraphData.at(-1) ?? 0
    const lastX = unlerp(0, maxNps, lastnps) * this.graphWidth
    const lastY = clamp(this.getYFromBeat(lastBeat), startY, endY)
    this.npsGraph.lineTo(lastX, lastY)
    this.npsGraph.lineTo(0, lastY)
    this.npsGraph.endFill()
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

    grd.addColorStop(0, colorFallback(Options.chart.npsGraph.color1).toHexa())
    grd.addColorStop(0.8, colorFallback(Options.chart.npsGraph.color2).toHexa())

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, quality, quality)

    return Texture.from(canvas)
  }
}
