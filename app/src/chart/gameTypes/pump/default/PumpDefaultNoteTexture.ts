import {
  AnimatedSprite,
  Container,
  Rectangle,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { Options } from "../../../../util/Options"

import { App } from "../../../../App"
import { splitTex } from "../../../../util/Util"
import { NotedataEntry } from "../../../sm/NoteTypes"

import tapCenterUrl from "../../../../../assets/noteskin/pump/default/tapCenter.png"
import tapDownLeftUrl from "../../../../../assets/noteskin/pump/default/tapDownLeft.png"

import liftCenterUrl from "../../../../../assets/noteskin/pump/default/liftCenter.png"
import liftDownLeftUrl from "../../../../../assets/noteskin/pump/default/liftDownLeft.png"

import fakeCenterUrl from "../../../../../assets/noteskin/pump/default/fakeCenter.png"
import fakeDownLeftUrl from "../../../../../assets/noteskin/pump/default/fakeDownLeft.png"

const TEXTURES: Record<string, Record<string, Texture>> = {
  Tap: {
    DownLeft: Texture.from(tapDownLeftUrl),
    Center: Texture.from(tapCenterUrl),
  },
  Lift: {
    DownLeft: Texture.from(liftDownLeftUrl),
    Center: Texture.from(liftCenterUrl),
  },
  Fake: {
    DownLeft: Texture.from(fakeDownLeftUrl),
    Center: Texture.from(fakeCenterUrl),
  },
}

export class PumpDefaultNoteTexture {
  static downLeftTex: RenderTexture
  static downLeftContainer = new Container<AnimatedSprite>()
  static centerTex: RenderTexture
  static centerContainer = new Container<AnimatedSprite>()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    PumpDefaultNoteTexture.downLeftTex = RenderTexture.create({
      width: 128 * 9,
      height: 128 * 3,
      resolution: Options.performance.resolution,
    })
    PumpDefaultNoteTexture.centerTex = RenderTexture.create({
      width: 128 * 9,
      height: 128 * 3,
      resolution: Options.performance.resolution,
    })

    this.layoutRow(this.downLeftContainer, TEXTURES.Tap.DownLeft, 0)
    this.layoutRow(this.downLeftContainer, TEXTURES.Fake.DownLeft, 1)
    this.layoutRow(this.downLeftContainer, TEXTURES.Lift.DownLeft, 2)

    this.layoutRow(this.centerContainer, TEXTURES.Tap.Center, 0)
    this.layoutRow(this.centerContainer, TEXTURES.Fake.Center, 1)
    this.layoutRow(this.centerContainer, TEXTURES.Lift.Center, 2)

    this.loaded = true
  }

  static layoutRow(container: Container, tex: Texture, offset: number) {
    const frames = splitTex(tex, 6, 9)
    for (let i = 0; i < 9; i++) {
      const spr = new AnimatedSprite(frames[i])
      spr.x = i * 128
      spr.y = offset * 128
      container.addChild(spr)
    }
  }

  static setArrowTexTime(app: App, beat: number, _second: number) {
    if (!this.loaded) return

    const frame =
      beat < 0 ? Math.floor((1 - (-beat % 1)) * 6) : Math.floor((beat % 1) * 6)

    this.downLeftContainer.children.forEach(a => (a.currentFrame = frame))
    this.centerContainer.children.forEach(a => (a.currentFrame = frame))

    app.renderer.render(PumpDefaultNoteTexture.downLeftContainer, {
      renderTexture: PumpDefaultNoteTexture.downLeftTex,
    })
    app.renderer.render(PumpDefaultNoteTexture.centerContainer, {
      renderTexture: PumpDefaultNoteTexture.centerTex,
    })
  }

  static setNoteTex(arrow: Sprite, note: NotedataEntry, columnName: string) {
    if (note.type == "Mine") {
      // arrow.texture = PumpDefaultNoteTexture.mineTex
      arrow.texture = Texture.WHITE
    } else {
      const quant = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(note.quant)
      const row = this.getNoteRow(note.type)
      const tex = columnName == "Center" ? this.centerTex : this.downLeftTex
      arrow.texture = new Texture(
        tex.baseTexture,
        new Rectangle(Math.min(8, quant) * 128, row * 128, 128, 128)
      )
    }
  }

  static getNoteRow(noteType: string) {
    switch (noteType) {
      case "Fake":
        return 1
      case "Lift":
        return 2
      default:
        return 0
    }
  }
}
