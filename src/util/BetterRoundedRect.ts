import { Graphics, NineSlicePlane, Renderer, RenderTexture } from "pixi.js"

export class BetterRoundedRect extends NineSlicePlane {
  private static graphics = new Graphics()
  static tex = RenderTexture.create({ width: 25, height: 25 })
  static init(renderer: Renderer) {
    this.tex = RenderTexture.create({
      width: 25,
      height: 25,
      resolution: renderer.resolution,
    })
    this.graphics.beginFill(0xffffff, 1)
    this.graphics.lineStyle(1, 0x000000)
    this.graphics.drawRoundedRect(0, 0, 25, 25, 5)
    this.graphics.endFill()
    renderer.render(this.graphics, { renderTexture: this.tex })
  }
  constructor() {
    super(BetterRoundedRect.tex, 5, 5, 5, 5)
  }
}
