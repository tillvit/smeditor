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
import { Options } from "../../../../util/Options"
import { NotedataEntry } from "../../../sm/NoteTypes"

import liftPartsUrl from "../../../../../assets/noteskin/dance/default/lift/parts.png"
import mineFrameUrl from "../../../../../assets/noteskin/dance/default/mine/frame.png"
import minePartsUrl from "../../../../../assets/noteskin/dance/default/mine/parts.png"
import tapPartsUrl from "../../../../../assets/noteskin/dance/default/tap/parts.png"

import arrowGradientFrag from "../../../../../assets/noteskin/dance/default/shader/arrow_gradient.frag?raw"
import liftGradientFrag from "../../../../../assets/noteskin/dance/default/shader/lift_gradient.frag?raw"
import mineGradientFrag from "../../../../../assets/noteskin/dance/default/shader/mine_gradient.frag?raw"
import noopFrag from "../../../../../assets/noteskin/dance/default/shader/noop.frag?raw"
import noopVert from "../../../../../assets/noteskin/dance/default/shader/noop.vert?raw"

import arrowBodyGeomText from "../../../../../assets/noteskin/dance/default/tap/body.txt?raw"
import arrowFrameGeomText from "../../../../../assets/noteskin/dance/default/tap/frame.txt?raw"

import liftBodyGeomText from "../../../../../assets/noteskin/dance/default/lift/body.txt?raw"
import mineBodyGeomText from "../../../../../assets/noteskin/dance/default/mine/body.txt?raw"
import { App } from "../../../../App"

const mine_frame_texture = Texture.from(mineFrameUrl)

export class DanceDefaultNoteTexture {
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

  static arrowFrameTex: RenderTexture
  static arrowFrame: Mesh<Shader>
  static arrowTex: RenderTexture
  static arrowContainer = new Container()
  static liftTex: RenderTexture
  static liftContainer = new Container()
  static mineTex: RenderTexture
  static mineConainer = new Container()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    DanceDefaultNoteTexture.arrowFrameTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })
    DanceDefaultNoteTexture.arrowTex = RenderTexture.create({
      width: 256,
      height: 320,
      resolution: Options.performance.resolution,
    })
    DanceDefaultNoteTexture.liftTex = RenderTexture.create({
      width: 256,
      height: 320,
      resolution: Options.performance.resolution,
    })
    DanceDefaultNoteTexture.mineTex = RenderTexture.create({
      width: 64,
      height: 64,
      resolution: Options.performance.resolution,
    })

    this.arrowBodyGeom = await this.loadGeometry(arrowBodyGeomText)
    this.arrowFrameGeom = await this.loadGeometry(arrowFrameGeomText)
    this.mineBodyGeom = await this.loadGeometry(mineBodyGeomText)
    this.liftBodyGeom = await this.loadGeometry(liftBodyGeomText)

    {
      const shader_frame = Shader.from(noopVert, noopFrag, {
        sampler0: this.arrowPartsTex,
      })
      const arrow_frame = new Mesh(
        DanceDefaultNoteTexture.arrowFrameGeom,
        shader_frame
      )
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
        const arrow_frame = new Sprite(DanceDefaultNoteTexture.arrowFrameTex)
        arrow_frame.x = (i % 3) * 64
        arrow_frame.y = Math.floor(i / 3) * 64
        const arrow_body = new Mesh(
          DanceDefaultNoteTexture.arrowBodyGeom,
          shader_body
        )
        arrow_body.x = (i % 3) * 64 + 32
        arrow_body.y = Math.floor(i / 3) * 64 + 32
        arrow_body.rotation = -Math.PI / 2
        arrow_body.name = "body" + i
        DanceDefaultNoteTexture.arrowContainer.addChild(arrow_frame)
        DanceDefaultNoteTexture.arrowContainer.addChild(arrow_body)
      }
    }
    {
      for (let i = 0; i < 10; i++) {
        const shader_body = Shader.from(noopVert, liftGradientFrag, {
          sampler0: this.liftPartsTex,
          time: 0,
          quant: i,
        })
        const arrow_body = new Mesh(
          DanceDefaultNoteTexture.liftBodyGeom,
          shader_body
        )
        arrow_body.x = (i % 3) * 64 + 32
        arrow_body.y = Math.floor(i / 3) * 64 + 32
        arrow_body.rotation = -Math.PI / 2
        arrow_body.name = "body" + i
        DanceDefaultNoteTexture.liftContainer.addChild(arrow_body)
      }
    }
    {
      const shader_body = Shader.from(noopVert, mineGradientFrag, {
        sampler0: this.minePartsTex,
        time: 0,
      })
      const mine_body = new Mesh(
        DanceDefaultNoteTexture.mineBodyGeom,
        shader_body
      )
      const mine_frame = new Sprite(mine_frame_texture)
      mine_frame.width = 64
      mine_frame.height = 64
      mine_frame.anchor.set(0.5)
      mine_frame.pivot.y = 3 // epic recenter
      DanceDefaultNoteTexture.mineConainer.position.set(32)
      DanceDefaultNoteTexture.mineConainer.addChild(mine_body)
      DanceDefaultNoteTexture.mineConainer.addChild(mine_frame)
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

  static setArrowTexTime(app: App, beat: number, second: number) {
    if (!this.loaded) return
    for (let i = 0; i < 10; i++) {
      const tapShader: Mesh<Shader> =
        DanceDefaultNoteTexture.arrowContainer.getChildByName("body" + i)!
      tapShader.shader.uniforms.time = beat
      const liftShader: Mesh<Shader> =
        DanceDefaultNoteTexture.liftContainer.getChildByName("body" + i)!
      liftShader.shader.uniforms.time = beat
    }
    ;(<Mesh>(
      DanceDefaultNoteTexture.mineConainer.children[0]
    )).shader.uniforms.time = second
    DanceDefaultNoteTexture.mineConainer.rotation = (second % 1) * Math.PI * 2

    app.renderer.render(DanceDefaultNoteTexture.arrowFrame, {
      renderTexture: DanceDefaultNoteTexture.arrowFrameTex,
    })
    app.renderer.render(DanceDefaultNoteTexture.arrowContainer, {
      renderTexture: DanceDefaultNoteTexture.arrowTex,
    })
    app.renderer.render(DanceDefaultNoteTexture.mineConainer, {
      renderTexture: DanceDefaultNoteTexture.mineTex,
    })
    app.renderer.render(DanceDefaultNoteTexture.liftContainer, {
      renderTexture: DanceDefaultNoteTexture.liftTex,
    })
  }

  static setNoteTex(arrow: Sprite, note: NotedataEntry) {
    if (note.type == "Mine") {
      arrow.texture = DanceDefaultNoteTexture.mineTex
    } else {
      const i = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(note.quant)
      arrow.texture = new Texture(
        note.type == "Lift"
          ? DanceDefaultNoteTexture.liftTex.baseTexture
          : DanceDefaultNoteTexture.arrowTex.baseTexture,
        new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64)
      )
    }
  }
}
