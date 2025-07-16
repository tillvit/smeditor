import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { assignTint } from "../../../util/Color"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"

const measureNumbers = {
  fontName: "Main",
  fontSize: 20,
  fill: ["#ffffff"],
}
export class BarlineContainer
  extends Container
  implements ChartRendererComponent
{
  readonly isEditGUI = true

  private renderer: ChartRenderer
  private barlineMap: Map<number, Sprite> = new Map()
  private barlineLabelMap: Map<number, BitmapText> = new Map()
  private barlinePool = new DisplayObjectPool({
    create: () => {
      const line = new Sprite(Texture.WHITE)
      assignTint(line, "text-color")
      return line
    },
  })
  private barlineLabelPool = new DisplayObjectPool({
    create: () => {
      const text = new BitmapText("", measureNumbers)
      assignTint(text, "text-color")
      return text
    },
  })

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    const timeSig = () => {
      this.barlineMap.clear()
      this.barlineLabelMap.clear()
      this.barlinePool.destroyAll()
      this.barlineLabelPool.destroyAll()
    }
    EventHandler.on("timeSigChanged", timeSig)
    this.on("destroyed", () => EventHandler.off("timeSigChanged", timeSig))

    this.addChild(this.barlinePool, this.barlineLabelPool)
  }

  update(firstBeat: number, lastBeat: number) {
    for (const [
      barBeat,
      isMeasure,
    ] of this.renderer.chart.timingData.getMeasureBeats(firstBeat, lastBeat)) {
      // Create missing barlines
      if (!this.barlineMap.has(barBeat)) {
        const barline = this.barlinePool.createChild()
        if (!barline) continue
        Object.assign(barline, {
          width: this.renderer.chart.gameType.notefieldWidth + 128,
          height: isMeasure ? 4 : 1,
          visible: true,
        })
        barline.anchor.set(0.5)
        this.barlineMap.set(barBeat, barline)
      }
      if (isMeasure && !this.barlineLabelMap.has(barBeat)) {
        const label = this.barlineLabelPool.createChild()
        if (!label) continue
        Object.assign(label, {
          x: (this.renderer.chart.gameType.notefieldWidth + 128) / -2 - 16,
          text: `${Math.round(
            this.renderer.chart.timingData.getMeasure(barBeat)
          )}`,
          visible: true,
        })
        label.anchor.set(1, 0.5)
        this.barlineLabelMap.set(barBeat, label)
      }
    }

    for (const [beat, child] of this.barlineMap.entries()) {
      if (beat < firstBeat || beat > lastBeat) {
        this.barlineMap.delete(beat)
        this.barlinePool.destroyChild(child)
        continue
      }
      child.y = this.renderer.getYPosFromBeat(beat)
    }

    for (const [beat, child] of this.barlineLabelMap.entries()) {
      if (beat < firstBeat || beat > lastBeat) {
        this.barlineLabelMap.delete(beat)
        this.barlineLabelPool.destroyChild(child)
        continue
      }
      child.y = this.renderer.getYPosFromBeat(beat)
    }
  }
}
