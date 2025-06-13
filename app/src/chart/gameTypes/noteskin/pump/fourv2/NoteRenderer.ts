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
import { splitTex } from "../../../../../util/PixiUtil"
import { NotedataEntry } from "../../../../sm/NoteTypes"

import tapCenterUrl from "./tapCenter.png"
import tapDownLeftUrl from "./tapDownLeft.png"

import liftCenterUrl from "./liftCenter.png"
import liftDownLeftUrl from "./liftDownLeft.png"

import fakeCenterUrl from "./fakeCenter.png"
import fakeDownLeftUrl from "./fakeDownLeft.png"

import { rgbtoHex } from "../../../../../util/Color"
import mineBaseUrl from "./mine/base.png"
import mineOverlayUrl from "./mine/overlay.png"
import mineUnderlayUrl from "./mine/underlay.png"

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
  Mine: {
    Base: Texture.from(mineBaseUrl),
    Overlay: Texture.from(mineOverlayUrl),
    Underlay: Texture.from(mineUnderlayUrl),
  },
}

export class NoteRenderer {
  static downLeftTex: RenderTexture
  static downLeftContainer = new Container<AnimatedSprite>()
  static centerTex: RenderTexture
  static centerContainer = new Container<AnimatedSprite>()
  static mineTex: RenderTexture
  static mineContainer = new Container<Sprite>()

  private static loaded = false

  static async initArrowTex() {
    if (this.loaded) return

    // Initialize rendertextures in here so we can read options
    NoteRenderer.downLeftTex = RenderTexture.create({
      width: 128 * 9,
      height: 128 * 3,
      resolution: Options.performance.resolution,
    })
    NoteRenderer.centerTex = RenderTexture.create({
      width: 128 * 9,
      height: 128 * 3,
      resolution: Options.performance.resolution,
    })
    NoteRenderer.mineTex = RenderTexture.create({
      width: 128 * 9,
      height: 128,
      resolution: Options.performance.resolution,
    })

    this.layoutRow(this.downLeftContainer, TEXTURES.Tap.DownLeft, 0)
    this.layoutRow(this.downLeftContainer, TEXTURES.Fake.DownLeft, 1)
    this.layoutRow(this.downLeftContainer, TEXTURES.Lift.DownLeft, 2)

    this.layoutRow(this.centerContainer, TEXTURES.Tap.Center, 0)
    this.layoutRow(this.centerContainer, TEXTURES.Fake.Center, 1)
    this.layoutRow(this.centerContainer, TEXTURES.Lift.Center, 2)

    this.createMines(this.mineContainer)

    this.loaded = true
  }

  static layoutRow(container: Container, tex: Texture, offset: number) {
    const frames = splitTex(tex, 6, 9, 128, 128)
    for (let i = 0; i < 9; i++) {
      const spr = new AnimatedSprite(frames[i])
      spr.x = i * 128
      spr.y = offset * 128
      container.addChild(spr)
    }
  }

  static createMines(container: Container) {
    const baseTex = splitTex(TEXTURES.Mine.Base, 1, 9, 128, 128).map(x => x[0])
    const overlayTex = splitTex(TEXTURES.Mine.Overlay, 1, 9, 128, 128).map(
      x => x[0]
    )
    const underlayTex = splitTex(TEXTURES.Mine.Underlay, 1, 9, 128, 128).map(
      x => x[0]
    )
    for (let i = 0; i < 9; i++) {
      const underlay = new Sprite(underlayTex[i])
      underlay.x = i * 128 + 64
      underlay.y = 64
      underlay.name = "u" + i
      underlay.anchor.set(0.5)

      const base = new Sprite(baseTex[i])
      base.x = i * 128 + 64
      base.y = 64
      base.name = "b" + i
      base.anchor.set(0.5)

      const overlay = new Sprite(overlayTex[i])
      overlay.x = i * 128 + 64
      overlay.y = 64
      overlay.name = "o" + i
      overlay.anchor.set(0.5)

      container.addChild(underlay, base, overlay)
    }
  }

  static setArrowTexTime(app: App) {
    if (!this.loaded) return
    const beat = app.chartManager.chartView!.getVisualBeat()

    const partialBeat = ((beat % 1) + 1) % 1
    const frame = Math.floor(partialBeat * 6)

    this.downLeftContainer.children.forEach(a => (a.currentFrame = frame))
    this.centerContainer.children.forEach(a => (a.currentFrame = frame))

    app.renderer.render(NoteRenderer.downLeftContainer, {
      renderTexture: NoteRenderer.downLeftTex,
    })
    app.renderer.render(NoteRenderer.centerContainer, {
      renderTexture: NoteRenderer.centerTex,
    })
    app.renderer.render(NoteRenderer.mineContainer, {
      renderTexture: NoteRenderer.mineTex,
    })

    for (let i = 0; i < 9; i++) {
      this.mineContainer.getChildByName<Sprite>("u" + i)!.tint = rgbtoHex(
        Math.round(255 - 153 * partialBeat),
        0,
        0
      )
      this.mineContainer.getChildByName<Sprite>("b" + i)!.rotation =
        (80 / 180) * Math.PI * beat
      this.mineContainer.getChildByName<Sprite>("o" + i)!.rotation =
        (-40 / 180) * Math.PI * beat
    }
  }

  static setNoteTex(
    arrow: Sprite,
    note: NotedataEntry | undefined,
    columnName: string
  ) {
    if (note === undefined) return Texture.WHITE
    if (note.type == "Mine") {
      const quant = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(note.quant)
      arrow.texture = new Texture(
        this.mineTex.baseTexture,
        new Rectangle(Math.min(8, quant) * 128, 0, 128, 128)
      )
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
