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
import { NotedataEntry } from "../../../../sm/NoteTypes"

import liftPartsUrl from "./lift/parts.png"
import mineFrameUrl from "./mine/frame.png"
import minePartsUrl from "./mine/parts.png"
import tapPartsUrl from "./tap/parts.png"

import arrowGradientFrag from "./shader/arrow_gradient.frag?raw"
import liftGradientFrag from "./shader/lift_gradient.frag?raw"
import mineGradientFrag from "./shader/mine_gradient.frag?raw"
import noopFrag from "./shader/noop.frag?raw"
import noopVert from "./shader/noop.vert?raw"

import liftBodyGeomText from "./lift/body.txt?raw"
import mineBodyGeomText from "./mine/body.txt?raw"
import mineFrameGeomText from "./mine/frame.txt?raw"
import arrowBodyGeomText from "./tap/body.txt?raw"
import arrowFrameGeomText from "./tap/frame.txt?raw"

const mine_frame_texture = Texture.from(mineFrameUrl)

export class ModelRenderer {
  static arrowPartsTex = BaseTexture.from(tapPartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static minePartsTex = BaseTexture.from(minePartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })
  static liftPartsTex = BaseTexture.from(liftPartsUrl, {
    mipmap: MIPMAP_MODES.OFF,
  })

  static arrowBodyGeom: Geometry
  static arrowFrameGeom: Geometry
  static liftBodyGeom: Geometry
  static mineBodyGeom: Geometry
  static mineFrameGeom: Geometry

  static arrowFrameTex: RenderTexture
  static arrowFrame: Mesh<Shader>
  static arrowTex: RenderTexture
  static arrowContainer = new Container()
  static liftTex: RenderTexture
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
      width: 256,
      height: 320,
      resolution: Options.performance.resolution,
    })
    ModelRenderer.mineTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })

    this.arrowBodyGeom = await this.loadGeometry(arrowBodyGeomText)
    this.arrowFrameGeom = await this.loadGeometry(arrowFrameGeomText)
    this.mineBodyGeom = await this.loadGeometry(mineBodyGeomText)
    this.mineFrameGeom = await this.loadGeometry(mineFrameGeomText)
    this.liftBodyGeom = await this.loadGeometry(liftBodyGeomText)

    {
      const shader_frame = Shader.from(noopVert, noopFrag, {
        sampler0: this.arrowPartsTex,
      })
      const arrow_frame = new Mesh(ModelRenderer.arrowFrameGeom, shader_frame)
      arrow_frame.x = 32
      arrow_frame.y = 32
      arrow_frame.rotation = -Math.PI / 2
      this.arrowFrame = arrow_frame
    }
    {
      for (let i = 0; i < 10; i++) {
        const shader_body = Shader.from(noopVert, arrowGradientFrag, {
          sampler0: this.arrowPartsTex,
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
      for (let i = 0; i < 10; i++) {
        const shader_body = Shader.from(noopVert, liftGradientFrag, {
          sampler0: this.liftPartsTex,
          time: 0,
          quant: i,
        })
        const arrow_body = new Mesh(ModelRenderer.liftBodyGeom, shader_body)
        arrow_body.x = (i % 3) * 64 + 32
        arrow_body.y = Math.floor(i / 3) * 64 + 32
        arrow_body.rotation = -Math.PI / 2
        arrow_body.name = "body" + i
        ModelRenderer.liftContainer.addChild(arrow_body)
      }
    }
    {
      const shader_body = Shader.from(noopVert, mineGradientFrag, {
        sampler0: this.minePartsTex,
        time: 0,
      })
      const shader_frame = Shader.from(noopVert, noopFrag, {
        sampler0: this.minePartsTex,
      })
      const mine_body = new Mesh(ModelRenderer.mineBodyGeom, shader_body)
      const mine_frame = new Mesh(ModelRenderer.mineFrameGeom, shader_frame)
      mine_frame.width = 64
      mine_frame.height = 64
      ModelRenderer.mineContainer.position.set(32)
      ModelRenderer.mineContainer.addChild(mine_body)
      ModelRenderer.mineContainer.addChild(mine_frame)
    }

    this.loaded = true
  }

  private static async loadGeometry(data: string): Promise<Geometry> {
    const lines = data.split("\n")
    const numVertices = parseInt(lines[0])
    const numTriangles = parseInt(lines[numVertices + 1])
    const vPos = []
    const vUvs = []
    const vIndex = []
    for (let i = 0; i < numVertices; i++) {
      const match =
        /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
          lines[i + 1]
        )
      if (match) {
        vPos.push(parseFloat(match[1]))
        vPos.push(parseFloat(match[2]))
        vUvs.push(parseFloat(match[3]))
        vUvs.push(parseFloat(match[4]))
      } else {
        console.error("Failed to load vertex " + lines[i + 1])
        return new Geometry()
      }
    }
    for (let i = 0; i < numTriangles; i++) {
      const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
        lines[i + 2 + numVertices]
      )
      if (match) {
        vIndex.push(parseFloat(match[1]))
        vIndex.push(parseFloat(match[2]))
        vIndex.push(parseFloat(match[3]))
      } else {
        console.error("Failed to load triangle " + lines[i + 2 + numVertices])
        return new Geometry()
      }
    }
    return new Geometry()
      .addAttribute("aVertexPosition", vPos, 2)
      .addAttribute("aUvs", vUvs, 2)
      .addIndex(vIndex)
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const beat = app.chartManager.chartView!.getVisualBeat()
    const second = app.chartManager.chartView!.getVisualTime()
    for (let i = 0; i < 10; i++) {
      const tapShader: Mesh<Shader> =
        ModelRenderer.arrowContainer.getChildByName("body" + i)!
      tapShader.shader.uniforms.time = beat
      const liftShader: Mesh<Shader> =
        ModelRenderer.liftContainer.getChildByName("body" + i)!
      liftShader.shader.uniforms.time = beat
    }
    ;(<Mesh>ModelRenderer.mineContainer.children[0]).shader.uniforms.time =
      second
    ModelRenderer.mineContainer.rotation = (second % 1) * Math.PI * 2

    app.renderer.render(ModelRenderer.arrowFrame, {
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
    if (!this.loaded) return Texture.WHITE
    if (note !== undefined && note.type == "Mine") {
      arrow.texture = ModelRenderer.mineTex
    } else {
      const i = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
        note?.quant ?? 4
      )
      arrow.texture = new Texture(
        note?.type == "Lift" ?? "Tap"
          ? ModelRenderer.liftTex.baseTexture
          : ModelRenderer.arrowTex.baseTexture,
        new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64)
      )
    }
  }
}
