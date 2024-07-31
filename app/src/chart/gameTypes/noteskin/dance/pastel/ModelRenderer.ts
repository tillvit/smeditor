import {
  BaseTexture,
  Container,
  Geometry,
  Mesh,
  MIPMAP_MODES,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
} from "pixi.js"

import { App } from "../../../../../App"
import { Options } from "../../../../../util/Options"

import mineFrameUrl from "./mine/frame.png"
import minePartsUrl from "./mine/parts.png"

import mineGradientFrag from "./shader/mine_gradient.frag?raw"
import noopVert from "./shader/noop.vert?raw"

import { loadGeometry } from "../../../../../util/Util"

import mineBodyGeomText from "./mine/body.txt?raw"

const mine_frame_texture = Texture.from(mineFrameUrl)

export class ModelRenderer {
  static minePartsTex = BaseTexture.from(minePartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })

  static mineBodyGeom: Geometry

  static mineTex: RenderTexture
  static mineContainer = new Container()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    ModelRenderer.mineTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })

    this.mineBodyGeom = await loadGeometry(mineBodyGeomText)

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

    this.loaded = true
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const second = app.chartManager.chartView!.getVisualTime()
    ;(<Mesh>ModelRenderer.mineContainer.children[0]).shader.uniforms.time =
      second
    ModelRenderer.mineContainer.rotation = (second % 1) * Math.PI * 2

    app.renderer.render(ModelRenderer.mineContainer, {
      renderTexture: ModelRenderer.mineTex,
    })
  }
}
