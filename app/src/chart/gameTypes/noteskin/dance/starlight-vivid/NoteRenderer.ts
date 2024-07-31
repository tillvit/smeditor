import {
  AnimatedSprite,
  Container,
  Rectangle,
  RenderTexture,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js"

import { App } from "../../../../../App"
import { Options } from "../../../../../util/Options"
import { splitTex } from "../../../../../util/Util"
import { NotedataEntry } from "../../../../sm/NoteTypes"

const TAP_TEXTURES: Record<string, Texture> = {}
;["colors", "mask", "note", "outline", "stroke", "top"].forEach(
  name =>
    (TAP_TEXTURES[name] = Texture.from(
      new URL(`./tap/${name}.png`, import.meta.url).href
    ))
)

const TAP_TOP_TEX = splitTex(TAP_TEXTURES.top, 4, 1, 384, 384)[0]

const colorOffsets = [-80, 0, 80]

export class NoteRenderer {
  static arrowFrameTex: RenderTexture
  static arrowFrameContainer = new Container()
  static arrowTex: RenderTexture
  static arrowContainer = new Container()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    NoteRenderer.arrowFrameTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })
    NoteRenderer.arrowTex = RenderTexture.create({
      width: 64 * 3,
      height: 64,
      resolution: Options.performance.resolution,
    })

    {
      const note = new Sprite(TAP_TEXTURES.note)
      note.width = 64
      note.height = 64
      const outline = new Sprite(TAP_TEXTURES.outline)
      outline.width = 64
      outline.height = 64
      const stroke = new Sprite(TAP_TEXTURES.stroke)
      stroke.width = 64
      stroke.height = 64
      this.arrowFrameContainer.addChild(note, outline, stroke)
    }
    {
      for (let i = 0; i < 3; i++) {
        const arrow_frame = new Sprite(this.arrowFrameTex)
        arrow_frame.x = i * 64

        const mask = new Sprite(TAP_TEXTURES.mask)
        mask.scale.set(1 / 6)
        mask.x = i * 64
        mask.y = 32
        mask.anchor.y = 0.5
        mask.alpha = 1

        const color = new TilingSprite(TAP_TEXTURES.colors, 256, 1024)
        color.tileScale.y = 1 / 4
        color.uvRespectAnchor = true
        color.x = i * 64
        color.y = 32
        color.tilePosition.y = 128 + colorOffsets[i]
        color.anchor.y = 0.5
        color.height = 64
        color.width = 64
        color.alpha = 1
        color.mask = mask
        color.name = "c" + i

        const top = new AnimatedSprite(TAP_TOP_TEX)
        top.scale.set(1 / 6)
        top.x = i * 64
        top.y = 32
        top.anchor.y = 0.5
        top.alpha = 1
        top.name = "t" + i

        this.arrowContainer.addChild(arrow_frame, color, mask, top)
      }
    }

    this.loaded = true
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const beat = app.chartManager.chartView!.getVisualBeat()
    const partialBeat = ((beat % 1) + 1) % 1
    const partialMeasure = ((beat % 4) + 4) % 4
    for (let i = 0; i < 3; i++) {
      this.arrowContainer.getChildByName<TilingSprite>(
        "c" + i
      )!.tilePosition.y = 128 + colorOffsets[i] - (partialMeasure / 4) * 256
      this.arrowContainer.getChildByName<AnimatedSprite>(
        "t" + i
      )!.currentFrame = Math.floor(partialBeat * 4)
    }

    app.renderer.render(NoteRenderer.arrowFrameContainer, {
      renderTexture: NoteRenderer.arrowFrameTex,
    })
    app.renderer.render(NoteRenderer.arrowContainer, {
      renderTexture: NoteRenderer.arrowTex,
    })
  }

  static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined) {
    let i = [4, 8].indexOf(note?.quant ?? 4)
    if (i == -1) i = 2
    arrow.texture = new Texture(
      NoteRenderer.arrowTex.baseTexture,
      new Rectangle(i * 64, 0, 64, 64)
    )
  }
}
