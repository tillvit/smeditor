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
  }
  update() {
    const bounds = this.renderer.getSelectionBounds()
    this.visible = !!bounds
    if (bounds) {
      this.position.x = Math.min(bounds.start.x, bounds.end.x)
      this.position.y = Math.min(bounds.start.y, bounds.end.y)
      this.width = Math.abs(bounds.end.x - bounds.start.x)
      this.height = Math.abs(bounds.end.y - bounds.start.y)
    }
  }
}
