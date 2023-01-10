import {
  RenderTexture,
  Container,
  Geometry,
  Texture,
  Shader,
  Mesh,
  Sprite,
  Rectangle,
  BaseTexture,
} from "pixi.js"
import { App } from "../../../App"
import { Options } from "../../../util/Options"
import { getQuant } from "../../../util/Util"
import { PartialNotedataEntry } from "../../sm/NoteTypes"

const mine_frame_texture = Texture.from("assets/noteskin/dance/mine/frame.png")

export class DanceNoteTexture {
  static noop_frag: string
  static noop_vert: string
  static arrow_gradient_frag: string
  static mine_gradient_frag: string

  static arrow_parts_texture = BaseTexture.from(
    "assets/noteskin/dance/tap/parts.png"
  )
  static mine_parts_texture = BaseTexture.from(
    "assets/noteskin/dance/mine/parts.png"
  )

  static arrow_body_geometry: Geometry
  static arrow_frame_geometry: Geometry

  static mine_body_geometry: Geometry

  static arrow_frame_tex = RenderTexture.create({
    width: 64,
    height: 64,
    resolution: Options.performance.resolution,
  })
  static arrow_frame?: Mesh<Shader>
  static arrow_tex = RenderTexture.create({
    width: 192,
    height: 192,
    resolution: Options.performance.resolution,
  })
  static arrow_container = new Container()
  static mine_tex = RenderTexture.create({
    width: 64,
    height: 64,
    resolution: Options.performance.resolution,
  })
  static mine_container = new Container()

  private static loaded = false

  static async initArrowTex(app: App) {
    if (this.loaded) return
    this.noop_frag = await fetch("assets/noteskin/dance/shader/noop.frag").then(
      response => response.text()
    )
    this.noop_vert = await fetch("assets/noteskin/dance/shader/noop.vert").then(
      response => response.text()
    )
    this.arrow_gradient_frag = await fetch(
      "assets/noteskin/dance/shader/arrow_gradient.frag"
    ).then(response => response.text())
    this.mine_gradient_frag = await fetch(
      "assets/noteskin/dance/shader/mine_gradient.frag"
    ).then(response => response.text())

    this.arrow_body_geometry = await this.loadGeometry(
      "assets/noteskin/dance/tap/body.txt"
    )
    this.arrow_frame_geometry = await this.loadGeometry(
      "assets/noteskin/dance/tap/frame.txt"
    )
    this.mine_body_geometry = await this.loadGeometry(
      "assets/noteskin/dance/mine/body.txt"
    )

    {
      const shader_frame = Shader.from(this.noop_vert, this.noop_frag, {
        sampler0: this.arrow_parts_texture,
      })
      const arrow_frame = new Mesh(
        DanceNoteTexture.arrow_frame_geometry,
        shader_frame
      )
      arrow_frame.x = 32
      arrow_frame.y = 32
      arrow_frame.rotation = -Math.PI / 2
      this.arrow_frame = arrow_frame
    }
    {
      for (let i = 0; i < 8; i++) {
        const shader_body = Shader.from(
          this.noop_vert,
          this.arrow_gradient_frag,
          { sampler0: this.arrow_parts_texture, time: 0, quant: i }
        )
        const arrow_frame = new Sprite(DanceNoteTexture.arrow_frame_tex)
        arrow_frame.x = (i % 3) * 64
        arrow_frame.y = Math.floor(i / 3) * 64
        const arrow_body = new Mesh(
          DanceNoteTexture.arrow_body_geometry,
          shader_body
        )
        arrow_body.x = (i % 3) * 64 + 32
        arrow_body.y = Math.floor(i / 3) * 64 + 32
        arrow_body.rotation = -Math.PI / 2
        arrow_body.name = "body" + i
        DanceNoteTexture.arrow_container.addChild(arrow_frame)
        DanceNoteTexture.arrow_container.addChild(arrow_body)
      }
    }
    {
      const shader_body = Shader.from(this.noop_vert, this.mine_gradient_frag, {
        sampler0: this.mine_parts_texture,
        time: 0,
      })
      const mine_body = new Mesh(
        DanceNoteTexture.mine_body_geometry,
        shader_body
      )
      const mine_frame = new Sprite(mine_frame_texture)
      mine_frame.width = 64
      mine_frame.height = 64
      mine_frame.anchor.set(0.5)
      DanceNoteTexture.mine_container.position.set(32)
      DanceNoteTexture.mine_container.addChild(mine_body)
      DanceNoteTexture.mine_container.addChild(mine_frame)
    }

    app.ticker.add(() => {
      app.renderer.render(DanceNoteTexture.arrow_frame!, {
        renderTexture: DanceNoteTexture.arrow_frame_tex,
      })
      app.renderer.render(DanceNoteTexture.arrow_container, {
        renderTexture: DanceNoteTexture.arrow_tex,
      })
      app.renderer.render(DanceNoteTexture.mine_container, {
        renderTexture: DanceNoteTexture.mine_tex,
      })
    })

    this.loaded = true
  }

  private static async loadGeometry(url: string): Promise<Geometry> {
    try {
      const text = await fetch(url).then(response => response.text())
      const lines = text.split("\n")
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
        } else throw Error("Failed to load vertex " + lines[i + 1])
      }
      for (let i = 0; i < numTriangles; i++) {
        const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
          lines[i + 2 + numVertices]
        )
        if (match) {
          vIndex.push(parseFloat(match[1]))
          vIndex.push(parseFloat(match[2]))
          vIndex.push(parseFloat(match[3]))
        } else
          throw Error("Failed to load triangle " + lines[i + 2 + numVertices])
      }
      return new Geometry()
        .addAttribute("aVertexPosition", vPos, 2)
        .addAttribute("aUvs", vUvs, 2)
        .addIndex(vIndex)
    } catch (err) {
      console.error(err)
      return new Geometry()
    }
  }

  static setArrowTexTime(beat: number, second: number) {
    if (!this.loaded) return
    for (let i = 0; i < 8; i++) {
      const note: Mesh<Shader> =
        DanceNoteTexture.arrow_container.getChildByName("body" + i)
      note.shader.uniforms.time = beat
    }
    ;(<Mesh>DanceNoteTexture.mine_container.children[0]).shader.uniforms.time =
      second
    DanceNoteTexture.mine_container.rotation = (second % 1) * Math.PI * 2
  }

  static setNoteTex(arrow: Sprite, note: PartialNotedataEntry) {
    if (note.type == "Mine") {
      arrow.texture = DanceNoteTexture.mine_tex
    } else {
      const i = Math.min(getQuant(note.beat), 7)
      arrow.texture = new Texture(
        DanceNoteTexture.arrow_tex.baseTexture,
        new Rectangle((i % 3) * 64, Math.floor(i / 3) * 64, 64, 64)
      )
    }
  }
}
