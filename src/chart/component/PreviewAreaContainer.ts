import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { clamp } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"

export class PreviewAreaContainer extends Container {
  private previewArea = new Sprite(Texture.WHITE)
  private previewText = new BitmapText("SONG PREVIEW", {
    fontName: "Main",
    fontSize: 13,
  })

  private renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.previewArea.alpha = 0.2
    this.addChild(this.previewArea, this.previewText)
    this.previewArea.tint = 0xa8a5c2
    this.previewArea.anchor.x = 0.5
    this.previewArea.height = 64
    this.previewArea.width = this.renderer.chart.gameType.notefieldWidth + 96
    this.previewText.x = -this.previewArea.width / 2 + 5
  }

  update() {
    const sampleStart = this.renderer.chart.sm.properties.SAMPLESTART
    const sampleLength = this.renderer.chart.sm.properties.SAMPLELENGTH
    if (
      sampleStart === undefined ||
      sampleLength === undefined ||
      (this.renderer.chartManager.getMode() == EditMode.Play &&
        Options.play.hideBarlines)
    ) {
      this.visible = false
      return
    }
    this.visible = true
    this.previewArea.y = this.renderer.getYPosFromSecond(
      parseFloat(sampleStart)
    )

    this.previewArea.height =
      this.renderer.getYPosFromSecond(
        parseFloat(sampleStart) + parseFloat(sampleLength)
      ) - this.previewArea.y
    this.previewText.y = clamp(
      this.renderer.getUpperBound() + 35,
      this.previewArea.y + 5,
      this.previewArea.y + this.previewArea.height - 15
    )
  }
}
