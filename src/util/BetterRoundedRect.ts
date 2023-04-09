import { Graphics, NineSlicePlane, Renderer, RenderTexture } from "pixi.js"

export class BetterRoundedRect extends NineSlicePlane {
  private static graphics = new Graphics()
  static textures = {
    default: RenderTexture.create({ width: 50, height: 50 }),
    noBorder: RenderTexture.create({ width: 50, height: 50 }),
    onlyBorder: RenderTexture.create({ width: 50, height: 50 }),
  }
  static init(renderer: Renderer) {
    this.textures.default = RenderTexture.create({
      width: 50,
      height: 50,
      resolution: renderer.resolution,
    })
    this.textures.noBorder = RenderTexture.create({
      width: 50,
      height: 50,
      resolution: renderer.resolution,
    })
    this.textures.onlyBorder = RenderTexture.create({
      width: 50,
      height: 50,
      resolution: renderer.resolution,
    })
    this.graphics.beginFill(0xffffff, 1)
    this.graphics.lineStyle(1, 0x000000)
    this.graphics.drawRoundedRect(0, 0, 50, 50, 5)
    this.graphics.endFill()
    renderer.render(this.graphics, { renderTexture: this.textures.default })
    this.graphics.clear()
    this.graphics.beginFill(0xffffff, 1)
    this.graphics.lineStyle(1, 0xffffff)
    this.graphics.drawRoundedRect(0, 0, 50, 50, 5)
    this.graphics.endFill()
    renderer.render(this.graphics, { renderTexture: this.textures.noBorder })
    this.graphics.clear()
    this.graphics.beginFill(0xffffff, 0)
    this.graphics.lineStyle(2, 0xffffff)
    this.graphics.drawRoundedRect(0, 0, 50, 50, 5)
    this.graphics.endFill()
    renderer.render(this.graphics, { renderTexture: this.textures.onlyBorder })
  }
  constructor(type?: keyof typeof BetterRoundedRect.textures) {
    super(BetterRoundedRect.textures[type ?? "default"], 5, 5, 5, 5)
  }
}
