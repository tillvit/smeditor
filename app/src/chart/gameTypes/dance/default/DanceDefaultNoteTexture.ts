import {
  Container,
  Mesh,
  MeshGeometry,
  MeshSimple,
  Rectangle,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { App } from "../../../../App"
import { Options } from "../../../../util/Options"
import { NotedataEntry } from "../../../sm/NoteTypes"

import liftPartsUrl from "./assets/lift/parts.png"
import mineFrameUrl from "./assets/mine/frame.png"
import minePartsUrl from "./assets/mine/parts.png"

import arrowBodyGeomText from "./assets/tap/body.txt?raw"
import arrowFrameGeomText from "./assets/tap/frame.txt?raw"

import liftBodyGeomText from "./assets/lift/body.txt?raw"
import mineBodyGeomText from "./assets/mine/body.txt?raw"
import { DanceDefaultNoteskinObject } from "./DanceDefaultNoteskin"

const mine_frame_texture = Texture.from(mineFrameUrl)

export class DanceDefaultNoteTexture {
  static minePartsTex = Texture.from(minePartsUrl)
  static liftPartsTex = Texture.from(liftPartsUrl)

  static arrowBodyGeom: MeshGeometry
  static arrowFrameGeom: MeshGeometry
  static liftBodyGeom: MeshGeometry
  static mineBodyGeom: MeshGeometry

  static arrowFrameTex: Texture
  static arrowFrame: Mesh
  static arrowTex: Texture
  static arrowContainer = new Container()
  static liftTex: Texture
  static liftContainer = new Container()
  static mineTex: Texture
  static mineContainer = new Container()

  private static loaded = false

  static async initArrowTex(app: App, noteskin: DanceDefaultNoteskinObject) {
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
      // const shader_frame = new Shader({
      //   // gpuProgram: new GpuProgram({

      //   // })
      //   glProgram: new GlProgram({
      //     fragment: noopFrag,
      //     vertex: noopVert,
      //   }),
      //   resources: {},
      // }) as TextureShader
      // shader_frame.texture = this.arrowPartsTex

      const arrow_frame = new MeshSimple({
        texture: noteskin.textures["TapParts"],
        vertices: this.arrowFrameGeom.positions,
        uvs: this.arrowFrameGeom.uvs,
        indices: this.arrowFrameGeom.indices,
      })

      arrow_frame.x = 32
      arrow_frame.y = 32
      this.arrowFrame = arrow_frame
      app.stage.addChild(new Sprite(this.arrowTex))
    }
    {
      for (let i = 0; i < 10; i++) {
        // const shader_body = Shader.from(noopVert, arrowGradientFrag, {
        //   sampler0: this.arrowPartsTex,
        //   time: 0,
        //   quant: i,
        // })
        const arrow_frame = new Sprite(this.arrowFrameTex)
        arrow_frame.x = (i % 3) * 64
        arrow_frame.y = Math.floor(i / 3) * 64

        arrow_frame.width = 64
        arrow_frame.height = 64
        // const arrow_body = new Mesh(
        //   DanceDefaultNoteTexture.arrowBodyGeom,
        //   shader_body
        // )
        // arrow_body.x = (i % 3) * 64 + 32
        // arrow_body.y = Math.floor(i / 3) * 64 + 32
        // arrow_body.rotation = -Math.PI / 2
        // arrow_body.name = "body" + i
        DanceDefaultNoteTexture.arrowContainer.addChild(arrow_frame)
        // DanceDefaultNoteTexture.arrowContainer.addChild(arrow_body)
      }
    }
    {
      for (let i = 0; i < 10; i++) {
        // const shader_body = Shader.from(noopVert, liftGradientFrag, {
        //   sampler0: this.liftPartsTex,
        //   time: 0,
        //   quant: i,
        // })
        // const arrow_body = new Mesh(
        //   DanceDefaultNoteTexture.liftBodyGeom,
        //   shader_body
        // )
        // arrow_body.x = (i % 3) * 64 + 32
        // arrow_body.y = Math.floor(i / 3) * 64 + 32
        // arrow_body.rotation = -Math.PI / 2
        // arrow_body.name = "body" + i
        // DanceDefaultNoteTexture.liftContainer.addChild(arrow_body)
      }
    }
    {
      // const shader_body = Shader.from(noopVert, mineGradientFrag, {
      //   sampler0: this.minePartsTex,
      //   time: 0,
      // })
      // const mine_body = new Mesh(
      //   DanceDefaultNoteTexture.mineBodyGeom,
      //   shader_body
      // )
      const mine_frame = new Sprite(mine_frame_texture)
      mine_frame.width = 64
      mine_frame.height = 64
      mine_frame.anchor.set(0.5)
      mine_frame.pivot.y = 3 // epic recenter
      DanceDefaultNoteTexture.mineContainer.position.set(32)
      // DanceDefaultNoteTexture.mineConainer.addChild(mine_body)
      DanceDefaultNoteTexture.mineContainer.addChild(mine_frame)
    }

    app.ticker.add(() => {
      app.renderer.render({
        container: DanceDefaultNoteTexture.arrowFrame,
        target: DanceDefaultNoteTexture.arrowFrameTex,
      })
      app.renderer.render({
        container: DanceDefaultNoteTexture.arrowContainer,
        target: DanceDefaultNoteTexture.arrowTex,
      })
      // app.renderer.render({
      //   container: DanceDefaultNoteTexture.mineContainer,
      //   target: DanceDefaultNoteTexture.mineTex,
      // })
      // app.renderer.render({
      //   container: DanceDefaultNoteTexture.liftContainer,
      //   target: DanceDefaultNoteTexture.liftTex,
      // })
    })

    this.loaded = true
  }

  private static async loadGeometry(data: string): Promise<MeshGeometry> {
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
        return new MeshGeometry({})
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
        return new MeshGeometry({})
      }
    }
    return new MeshGeometry({
      positions: new Float32Array(vPos),
      uvs: new Float32Array(vUvs),
      indices: new Uint32Array(vIndex),
    })
  }

  static setArrowTexTime(beat: number, second: number) {
    if (!this.loaded) return
    // for (let i = 0; i < 10; i++) {
    //   const tapShader: Mesh<Shader> =
    //     DanceDefaultNoteTexture.arrowContainer.getChildByName("body" + i)!
    //   tapShader.shader.uniforms.time = beat
    //   const liftShader: Mesh<Shader> =
    //     DanceDefaultNoteTexture.liftContainer.getChildByName("body" + i)!
    //   liftShader.shader.uniforms.time = beat
    // }
    // ;(<Mesh>(
    //   DanceDefaultNoteTexture.mineConainer.children[0]
    // )).shader.uniforms.time = second
    DanceDefaultNoteTexture.mineContainer.rotation = (second % 1) * Math.PI * 2
  }

  static setNoteTex(arrow: Sprite, note: NotedataEntry) {
    if (note.type == "Mine") {
      arrow.texture = DanceDefaultNoteTexture.mineTex
    } else {
      const i = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(note.quant)
      arrow.texture = new Texture({
        source:
          note.type == "Lift"
            ? DanceDefaultNoteTexture.liftTex.source
            : DanceDefaultNoteTexture.arrowTex.source,
        frame: new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64),
      })
    }
  }
}
