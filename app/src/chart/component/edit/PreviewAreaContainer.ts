import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { clamp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"

export class PreviewAreaContainer
  extends Container
  implements ChartRendererComponent
{
  private previewArea = new Sprite(Texture.WHITE)
  private previewText = new BitmapText("SONG PREVIEW", {
    fontName: "Main",
    fontSize: 13,
  })

  private renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    Object.assign(this.previewArea, {
      alpha: 0.2,
      tint: 0xa8a5c2,
      width: this.renderer.chart.gameType.notefieldWidth + 96,
      height: 64,
    })
    this.previewText.x = -this.previewArea.width / 2 + 5
    this.previewArea.anchor.x = 0.5
    this.addChild(this.previewArea, this.previewText)
  }

  update(firstBeat: number, lastBEat: number) {
    const sampleStart = Number(this.renderer.chart.sm.properties.SAMPLESTART)
    const sampleLength = Number(this.renderer.chart.sm.properties.SAMPLELENGTH)
    if (
      Number.isNaN(sampleStart) ||
      Number.isNaN(sampleLength) ||
      !this.renderer.shouldDisplayBarlines() ||
      this.renderer.chart.timingData.getBeatFromSeconds(
        sampleStart + sampleLength
      ) < firstBeat ||
      this.renderer.chart.timingData.getBeatFromSeconds(sampleStart) > lastBEat
    ) {
      this.visible = false
      return
    }
    this.visible = true

    let yStart = this.renderer.getYPosFromSecond(sampleStart)
    let yEnd = this.renderer.getYPosFromSecond(sampleStart + sampleLength)
    if (yEnd < yStart) [yEnd, yStart] = [yStart, yEnd]

    this.previewArea.y = yStart

    this.previewArea.height = yEnd - yStart

    this.previewText.anchor.y = Options.chart.reverse ? 1 : 0

    if (Options.chart.reverse) {
      this.previewText.y = clamp(
        this.renderer.getUpperBound() - 35,
        this.previewArea.y + 15,
        this.previewArea.y + this.previewArea.height - 5
      )
    } else {
      this.previewText.y = clamp(
        this.renderer.getUpperBound() + 35,
        this.previewArea.y + 5,
        this.previewArea.y + this.previewArea.height - 15
      )
    }
  }
}
