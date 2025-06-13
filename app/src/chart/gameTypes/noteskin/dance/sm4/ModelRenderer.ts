import {
  AnimatedSprite,
  BaseTexture,
  Container,
  Geometry,
  Mesh,
  MIPMAP_MODES,
  Rectangle,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
} from "pixi.js"

import { App } from "../../../../../App"
import { Options } from "../../../../../util/Options"
import { NotedataEntry } from "../../../../sm/NoteTypes"

import mineFrameUrl from "./mine/frame.png"
import minePartsUrl from "./mine/parts.png"

import mineBodyGeomText from "./mine/body.txt?raw"
import mineGradientFrag from "./shader/mine_gradient.frag?raw"
import noopVert from "./shader/noop.vert?raw"

import { loadGeometry, splitTex } from "../../../../../util/PixiUtil"
import liftUrl from "./lift.png"
import tapUrl from "./tap.png"

const mine_frame_texture = Texture.from(mineFrameUrl)
const tapTex = splitTex(Texture.from(tapUrl), 8, 8, 64, 64)
const liftTex = splitTex(Texture.from(liftUrl), 4, 1, 64, 64)[0]

export class ModelRenderer {
  static minePartsTex = BaseTexture.from(minePartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })

  static mineBodyGeom: Geometry

  static arrowTex: RenderTexture
  static arrowContainer = new Container()
  static mineTex: RenderTexture
  static mineContainer = new Container()
  static liftTex: RenderTexture
  static liftContainer = new Container()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    ModelRenderer.arrowTex = RenderTexture.create({
      width: 256,
      height: 256,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.mineTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.liftTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })

    this.mineBodyGeom = await loadGeometry(mineBodyGeomText)

    {
      for (let i = 0; i < 8; i++) {
        const note = new AnimatedSprite(tapTex[i])
        note.x = (i % 3) * 64 + 32
        note.y = Math.floor(i / 3) * 64 + 32
        note.anchor.set(0.5)
        note.name = "note" + i
        ModelRenderer.arrowContainer.addChild(note)
      }
    }
    {
      const note = new AnimatedSprite(liftTex)
      note.x = 32
      note.y = 32
      note.anchor.set(0.5)

      note.name = "note"
      ModelRenderer.liftContainer.addChild(note)
    }
    {
      const shader_body = Shader.from(noopVert, mineGradientFrag, {
        sampler0: this.minePartsTex,
        time: 0,
      })
      const mine_body = new Mesh(ModelRenderer.mineBodyGeom, shader_body)
      const mine_frame = new Sprite(mine_frame_texture)
      mine_frame.width = 64
      mine_frame.height = 64
      mine_frame.anchor.set(0.5)
      mine_frame.pivot.y = 3 // epic recenter
      ModelRenderer.mineContainer.position.set(32)
      ModelRenderer.mineContainer.addChild(mine_body)
      ModelRenderer.mineContainer.addChild(mine_frame)
    }

    this.loaded = true
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const beat = app.chartManager.chartView!.getVisualBeat()
    const second = app.chartManager.chartView!.getVisualTime()
    const partialBeat = ((beat % 4) + 4) % 4
    for (let i = 0; i < 8; i++) {
      const tap: AnimatedSprite = ModelRenderer.arrowContainer.getChildByName(
        "note" + i
      )!
      tap.currentFrame = Math.floor(partialBeat * 2)
    }
    const lift = ModelRenderer.liftContainer.children[0] as AnimatedSprite
    lift.currentFrame = Math.floor(partialBeat)
    ;(<Mesh>ModelRenderer.mineContainer.children[0]).shader.uniforms.time =
      second
    ModelRenderer.mineContainer.rotation = (second % 1) * Math.PI * 2

    app.renderer.render(ModelRenderer.arrowContainer, {
      renderTexture: ModelRenderer.arrowTex,
    })
    app.renderer.render(ModelRenderer.mineContainer, {
      renderTexture: ModelRenderer.mineTex,
    })
    app.renderer.render(ModelRenderer.liftContainer, {
      renderTexture: ModelRenderer.liftTex,
    })
  }

  static setNoteTex(arrow: Sprite, note: NotedataEntry | undefined) {
    if (note !== undefined && note.type == "Mine") {
      arrow.texture = ModelRenderer.mineTex
    } else if (note !== undefined && note.type == "Lift") {
      arrow.texture = ModelRenderer.liftTex
    } else {
      const i = Math.min(
        [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(note?.quant ?? 4),
        7
      )
      arrow.texture = new Texture(
        ModelRenderer.arrowTex.baseTexture,
        new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64)
      )
    }
  }
}
