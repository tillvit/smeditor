import {
  AnimatedSprite,
  Container,
  Rectangle,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { Options } from "../../../../../util/Options"

import { App } from "../../../../../App"
import { splitTex } from "../../../../../util/Util"
import { NotedataEntry } from "../../../../sm/NoteTypes"

export const tapTex: Record<string, Texture[]> = {}

const cols = ["DownLeft", "UpLeft", "Center", "UpRight", "DownRight"]

for (const name of cols) {
  tapTex[name] = splitTex(
    Texture.from(new URL(`./tap/${name}.png`, import.meta.url).href),
    3,
    2,
    96,
    96
  ).flat()
}

const rollTex: Record<string, Texture[]> = {}

for (const name of cols) {
  rollTex[name] = splitTex(
    Texture.from(new URL(`./roll/${name}.png`, import.meta.url).href),
    3,
    2,
    96,
    96
  ).flat()
}

const mineTex = splitTex(
  Texture.from(new URL(`./mine.png`, import.meta.url).href),
  3,
  2,
  96,
  96
).flat()

export class NoteRenderer {
  static noteTex: RenderTexture
  static noteContainer = new Container<AnimatedSprite>()

  static rollTex: RenderTexture
  static rollContainer = new Container<AnimatedSprite>()

  static mineTex: RenderTexture
  static mine: AnimatedSprite

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    NoteRenderer.noteTex = RenderTexture.create({
      width: 96 * 5,
      height: 96,
      resolution: Options.performance.resolution,
    })

    NoteRenderer.rollTex = RenderTexture.create({
      width: 96 * 5,
      height: 96,
      resolution: Options.performance.resolution,
    })

    NoteRenderer.mineTex = RenderTexture.create({
      width: 96,
      height: 96,
      resolution: Options.performance.resolution,
    })

    for (const col of cols) {
      this.createSprite(this.noteContainer, col, tapTex)
    }

    for (const col of cols) {
      this.createSprite(this.rollContainer, col, rollTex)
    }

    this.mine = new AnimatedSprite(mineTex)

    this.loaded = true
  }

  static createSprite(
    container: Container,
    column: string,
    texes: Record<string, Texture[]>
  ) {
    const xOffset = cols.indexOf(column) * 96
    const spr = new AnimatedSprite(texes[column])
    spr.x = xOffset
    container.addChild(spr)
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const time = app.chartManager.chartView!.getVisualTime()

    const frame = Math.floor(((((time % 0.3) + 0.3) % 0.3) / 0.3) * 6)

    this.noteContainer.children.forEach(a => (a.currentFrame = frame))
    this.rollContainer.children.forEach(a => (a.currentFrame = frame))
    this.mine.currentFrame = frame

    app.renderer.render(NoteRenderer.noteContainer, {
      renderTexture: NoteRenderer.noteTex,
    })

    app.renderer.render(NoteRenderer.rollContainer, {
      renderTexture: NoteRenderer.rollTex,
    })

    app.renderer.render(NoteRenderer.mine, {
      renderTexture: NoteRenderer.mineTex,
    })
  }

  static setNoteTex(
    arrow: Sprite,
    note: NotedataEntry | undefined,
    columnName: string
  ) {
    if (note === undefined) return Texture.WHITE
    if (note.type == "Mine") {
      arrow.texture = this.mineTex
    } else {
      const x = cols.indexOf(columnName) * 96
      arrow.texture = new Texture(
        this.noteTex.baseTexture,
        new Rectangle(x, 0, 96, 96)
      )
    }
  }

  static setRollTex(arrow: Sprite, columnName: string) {
    const x = cols.indexOf(columnName) * 96
    arrow.texture = new Texture(
      this.rollTex.baseTexture,
      new Rectangle(x, 0, 96, 96)
    )
  }
}
