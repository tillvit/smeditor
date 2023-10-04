import { Container, Sprite, Texture } from "pixi.js"
import { EditMode } from "../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../ChartRenderer"

export class SelectionAreaContainer
  extends Container
  implements ChartRendererComponent
{
  private startMarker: Sprite = new Sprite(Texture.WHITE)
  private selectionArea: Sprite = new Sprite(Texture.WHITE)

  private renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    Object.assign(this.startMarker, {
      alpha: 0,
      width: this.renderer.chart.gameType.notefieldWidth,
      height: 64,
    })
    Object.assign(this.selectionArea, {
      alpha: 0,
      tint: 0x4e6fa3,
      width: this.renderer.chart.gameType.notefieldWidth,
      height: 64,
    })
    this.startMarker.anchor.set(0.5)
    this.selectionArea.anchor.x = 0.5
    this.addChild(this.selectionArea, this.startMarker)
  }

  update() {
    if (this.renderer.chartManager.getMode() == EditMode.Play) {
      this.visible = false
      return
    }
    this.visible = true
    const start = this.renderer.chartManager.startRegion
    const end = this.renderer.chartManager.endRegion
    if (start !== undefined && end === undefined) {
      this.startMarker.alpha = Math.sin(Date.now() / 320) * 0.1 + 0.3
      this.startMarker.y = this.renderer.getYPosFromBeat(start)
    } else this.startMarker.alpha = 0
    if (start !== undefined && end !== undefined) {
      this.selectionArea.alpha = Math.sin(Date.now() / 320) * 0.1 + 0.3
      this.selectionArea.y = this.renderer.getYPosFromBeat(Math.min(start, end))
      this.selectionArea.height =
        this.renderer.getYPosFromBeat(Math.max(start, end)) -
        this.selectionArea.y
    } else this.selectionArea.alpha = 0
  }
}
