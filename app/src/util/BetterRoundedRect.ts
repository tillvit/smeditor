import { Graphics, NineSliceSprite, Renderer, RenderTexture } from "pixi.js"

export class BetterRoundedRect extends NineSliceSprite {
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
    this.graphics
      .stroke({ color: 0x000000, width: 1 })
      .roundRect(0, 0, 50, 50, 5)
      .fill(0xffffff)

    renderer.render({
      container: this.graphics,
      target: this.textures.default,
    })

    this.graphics
      .clear()
      .stroke({ color: 0xffffff, width: 1 })
      .roundRect(0, 0, 50, 50, 5)
      .fill(0xffffff)

    renderer.render({
      container: this.graphics,
      target: this.textures.noBorder,
    })

    this.graphics
      .clear()
      .stroke({ color: 0xffffff, width: 2 })
      .roundRect(0, 0, 50, 50, 5)

    renderer.render({
      container: this.graphics,
      target: this.textures.onlyBorder,
    })
  }
  constructor(type?: keyof typeof BetterRoundedRect.textures) {
    super({
      texture: BetterRoundedRect.textures[type ?? "default"],
      leftWidth: 5,
      topHeight: 5,
      rightWidth: 5,
      bottomHeight: 5,
    })
  }
}
