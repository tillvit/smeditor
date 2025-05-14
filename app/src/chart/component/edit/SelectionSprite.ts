import { Sprite, Texture } from "pixi.js"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"

export class SelectionBoundary
  extends Sprite
  implements ChartRendererComponent
{
  private renderer

  constructor(renderer: ChartRenderer) {
    super(Texture.WHITE)
    this.renderer = renderer
    this.visible = false
    this.alpha = 0.2
    this.eventMode = "none"
  }
  update() {
    const bounds = this.renderer.getSelectionBounds()
    this.visible = !!bounds

    if (bounds) {
      const startY = this.renderer.getYPosFromBeat(bounds?.startBeat)
      const endY = this.renderer.getYPosFromBeat(bounds?.endBeat)
      this.position.x = Math.min(bounds.startX, bounds.endX)
      this.position.y = Math.min(startY, endY)
      this.width = Math.abs(bounds.endX - bounds.startX)
      this.height = Math.abs(endY - startY)
    }
  }
}
