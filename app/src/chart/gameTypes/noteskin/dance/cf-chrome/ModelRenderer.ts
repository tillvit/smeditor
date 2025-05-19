import {
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
import { loadGeometry } from "../../../../../util/Util"
import { NotedataEntry } from "../../../../sm/NoteTypes"

import mineFrameUrl from "./mine/frame.png"
import minePartsUrl from "./mine/parts.png"

import tapBodyUrl from "./tap/body.png"
import tapFrameBlackUrl from "./tap/frameBlack.png"
import tapFrameChromeUrl from "./tap/frameChrome.png"

import liftFrameBlackUrl from "./lift/frameBlack.png"
import liftFrameChromeUrl from "./lift/frameChrome.png"

import arrowGradientFrag from "./shader/arrow_gradient.frag?raw"
import mineGradientFrag from "./shader/mine_gradient.frag?raw"
import noopFrag from "./shader/noop.frag?raw"
import noopVert from "./shader/noop.vert?raw"

import arrowBodyGeomText from "./tap/body.txt?raw"
import arrowFrameBlackGeomText from "./tap/frameBlack.txt?raw"
import arrowFrameChromeGeomText from "./tap/frameChrome.txt?raw"

import liftFrameBlackGeomText from "./lift/frameBlack.txt?raw"
import liftFrameChromeGeomText from "./lift/frameChrome.txt?raw"

import mineBodyGeomText from "./mine/body.txt?raw"

const mine_frame_texture = Texture.from(mineFrameUrl)

export class ModelRenderer {
  static arrowBodyTex = BaseTexture.from(tapBodyUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static arrowFrameChromeTex = BaseTexture.from(tapFrameChromeUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static arrowFrameBlackTex = BaseTexture.from(tapFrameBlackUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static minePartsTex = BaseTexture.from(minePartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static liftFrameChromeTex = BaseTexture.from(liftFrameChromeUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static liftFrameBlackTex = BaseTexture.from(liftFrameBlackUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })

  static arrowBodyGeom: Geometry
  static arrowFrameBlackGeom: Geometry
  static arrowFrameChromeGeom: Geometry

  static liftFrameBlackGeom: Geometry
  static liftFrameChromeGeom: Geometry

  static mineBodyGeom: Geometry

  static arrowFrameTex: RenderTexture
  static arrowChrome: Mesh<Shader>
  static arrowBlack: Mesh<Shader>
  static arrowFrameContainer = new Container()

  static arrowTex: RenderTexture
  static arrowContainer = new Container()

  static liftTex: RenderTexture
  static liftChrome: Mesh<Shader>
  static liftBlack: Mesh<Shader>
  static liftContainer = new Container()

  static mineTex: RenderTexture
  static mineContainer = new Container()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    ModelRenderer.arrowFrameTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.arrowTex = RenderTexture.create({
      width: 256,
      height: 320,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.liftTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.mineTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })

    this.arrowBodyGeom = await loadGeometry(arrowBodyGeomText)
    this.arrowFrameChromeGeom = await loadGeometry(arrowFrameChromeGeomText)
    this.arrowFrameBlackGeom = await loadGeometry(arrowFrameBlackGeomText)
    this.mineBodyGeom = await loadGeometry(mineBodyGeomText)
    this.liftFrameChromeGeom = await loadGeometry(liftFrameChromeGeomText)
    this.liftFrameBlackGeom = await loadGeometry(liftFrameBlackGeomText)

    {
      const chrome_shader = Shader.from(noopVert, arrowGradientFrag, {
        sampler0: this.arrowFrameChromeTex,
        time: 0,
        quant: 0,
      })
      const chrome = new Mesh(ModelRenderer.arrowFrameChromeGeom, chrome_shader)
      chrome.x = 32
      chrome.y = 32
      chrome.rotation = -Math.PI / 2
      this.arrowChrome = chrome

      const black_shader = Shader.from(noopVert, noopFrag, {
        sampler0: this.arrowFrameBlackTex,
      })
      const black = new Mesh(ModelRenderer.arrowFrameBlackGeom, black_shader)
      black.x = 32
      black.y = 32
      black.rotation = -Math.PI / 2
      this.arrowBlack = black

      this.arrowFrameContainer.addChild(chrome, black)
    }
    {
      for (let i = 0; i < 10; i++) {
        const shader_body = Shader.from(noopVert, arrowGradientFrag, {
          sampler0: this.arrowBodyTex,
          time: 0,
          quant: i,
        })
        const arrow_frame = new Sprite(ModelRenderer.arrowFrameTex)
        arrow_frame.x = (i % 3) * 64
        arrow_frame.y = Math.floor(i / 3) * 64
        const arrow_body = new Mesh(ModelRenderer.arrowBodyGeom, shader_body)
        arrow_body.x = (i % 3) * 64 + 32
        arrow_body.y = Math.floor(i / 3) * 64 + 32
        arrow_body.rotation = -Math.PI / 2
        arrow_body.name = "body" + i
        ModelRenderer.arrowContainer.addChild(arrow_frame)
        ModelRenderer.arrowContainer.addChild(arrow_body)
      }
    }
    {
      const chrome_shader = Shader.from(noopVert, arrowGradientFrag, {
        sampler0: this.liftFrameChromeTex,
        time: 0,
        quant: 0,
      })
      const chrome = new Mesh(ModelRenderer.liftFrameChromeGeom, chrome_shader)
      chrome.x = 32
      chrome.y = 32
      chrome.rotation = -Math.PI / 2
      this.liftChrome = chrome

      const black_shader = Shader.from(noopVert, noopFrag, {
        sampler0: this.liftFrameBlackTex,
      })
      const black = new Mesh(ModelRenderer.liftFrameBlackGeom, black_shader)
      black.x = 32
      black.y = 32
      black.rotation = -Math.PI / 2
      this.liftBlack = black

      this.liftContainer.addChild(chrome, black)
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
    for (let i = 0; i < 10; i++) {
      const tapShader: Mesh<Shader> =
        ModelRenderer.arrowContainer.getChildByName("body" + i)!
      tapShader.shader.uniforms.time = beat
    }
    this.arrowChrome.shader.uniforms.time = beat
    this.liftChrome.shader.uniforms.time = beat
    ;(<Mesh>ModelRenderer.mineContainer.children[0]).shader.uniforms.time =
      second
    ModelRenderer.mineContainer.rotation = (second % 1) * Math.PI * 2

    app.renderer.render(ModelRenderer.arrowFrameContainer, {
      renderTexture: ModelRenderer.arrowFrameTex,
    })
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
      const i = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
        note?.quant ?? 4
      )
      arrow.texture = new Texture(
        (note?.type ?? "Tap") == "Lift"
          ? ModelRenderer.liftTex.baseTexture
          : ModelRenderer.arrowTex.baseTexture,
        new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64)
      )
    }
  }
}
