import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { Noteskin } from "../../Noteskin"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { rgbtoHex } from "../../../../../util/Color"
import { splitTex } from "../../../../../util/PixiUtil"
import flashUrl from "./flash/flash.png"
import holdFlashUrl from "./flash/hold.png"
import mineUrl from "./flash/mine.png"

const holdTex = Texture.from(holdFlashUrl)
const mineTex = Texture.from(mineUrl)
const flashTex = Texture.from(flashUrl)

const FLASH_COLORS: Record<string, number[]> = {
  w0: [1.0, 1.0, 1.0, 1],
  w2: [1.0, 1.0, 0.3, 1],
  w3: [0.0, 1.0, 0.4, 1],
  w4: [0.3, 0.8, 1.0, 1],
  w5: [0.8, 0.0, 0.6, 1],
  held: [1.0, 1.0, 1.0, 1],
}

export class NoteFlashContainer extends Container {
  holdExplosion = new AnimatedSprite(splitTex(holdTex, 2, 1, 128, 128)[0])
  standard = new Sprite(flashTex)

  anims = new Set<string>()

  constructor(noteskin: Noteskin, col: number) {
    super()
    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        const col = FLASH_COLORS[event.judgement.id] ?? [1, 1, 1, 1]
        this.standard.tint = rgbtoHex(col[0] * 255, col[1] * 255, col[2] * 255)
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            this.standard,
            {
              "0": {
                alpha: 1.0,
                "scale.x": 1,
                "scale.y": 1,
              },
              "0.5": {
                alpha: 1.0,
                "scale.x": 1.1,
                "scale.y": 1.1,
              },
              "1": {
                alpha: 0,
                "scale.x": 1.1,
                "scale.y": 1.1,
              },
            },
            0.12
          )
        )
      }
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        const col = FLASH_COLORS.w2
        this.standard.tint = rgbtoHex(col[0] * 255, col[1] * 255, col[2] * 255)
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            this.standard,
            {
              "0": {
                alpha: 1.0,
                "scale.x": 1,
                "scale.y": 1,
              },
              "0.5": {
                alpha: 1.0,
                "scale.x": 1.1,
                "scale.y": 1.1,
              },
              "1": {
                alpha: 0,
                "scale.x": 1.1,
                "scale.y": 1.1,
              },
            },
            0.12
          )
        )
      }
    })

    noteskin.on(this, "holdon", event => {
      if (col == event.columnNumber) {
        this.holdExplosion.visible = true
      }
    })

    noteskin.on(this, "holdoff", event => {
      if (col == event.columnNumber) {
        this.holdExplosion.visible = false
      }
    })

    noteskin.on(this, "rollon", event => {
      if (col == event.columnNumber) {
        this.holdExplosion.visible = true
      }
    })

    noteskin.on(this, "rolloff", event => {
      if (col == event.columnNumber) {
        this.holdExplosion.visible = false
      }
    })

    noteskin.on(this, "hitmine", event => {
      if (col == event.columnNumber) {
        const mine = new Sprite(mineTex)
        mine.alpha = 0
        mine.anchor.set(0.5)
        mine.blendMode = BLEND_MODES.ADD
        this.addChild(mine)
        BezierAnimator.animate(
          mine,
          {
            "0": {
              alpha: 1,
              rotation: 0,
            },
            "0.5": {
              alpha: 1,
              rotation: (90 * Math.PI) / 180,
            },
            "1": {
              alpha: 0,
              rotation: (180 * Math.PI) / 180,
            },
          },
          0.4,
          undefined,
          () => mine.destroy()
        )
      }
    })

    noteskin.onUpdate(this, () => {
      this.holdExplosion.rotation = -this.rotation
    })

    this.holdExplosion.visible = false
    this.holdExplosion.anchor.set(0.5)
    this.holdExplosion.play()
    this.addChild(this.holdExplosion)

    this.standard.alpha = 0
    this.standard.anchor.set(0.5)
    this.addChild(this.standard)
  }
}
