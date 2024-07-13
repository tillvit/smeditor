import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { NoteSkin } from "../../NoteSkin"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { rgbtoHex } from "../../../../../util/Color"
import flashUrl from "./flash/flash.png"
import mineUrl from "./flash/mine.png"

const FLASH_COLORS: Record<string, number[]> = {
  w0: [1.0, 1.0, 1.0, 1],
  w2: [1.0, 1.0, 0.3, 1],
  w3: [0.0, 1.0, 0.4, 1],
  w4: [0.3, 0.8, 1.0, 1],
  w5: [0.8, 0.0, 0.6, 1],
  held: [1.0, 1.0, 1.0, 1],
}

const flashTex = Texture.from(flashUrl)
const mineTex = Texture.from(mineUrl)

export class NoteFlashContainer extends Container {
  standard = new Sprite(flashTex)

  standardAnim: string | undefined

  anims = new Set<string>()

  constructor(noteskin: NoteSkin, col: number) {
    super()

    this.standard.blendMode = BLEND_MODES.ADD

    const baseScale = 0.5

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        const col = FLASH_COLORS[event.judgement.id] ?? [1, 1, 1, 1]
        this.standard.tint = rgbtoHex(col[0] * 255, col[1] * 255, col[2] * 255)
        BezierAnimator.finish(this.standardAnim)
        this.standardAnim = BezierAnimator.animate(
          this.standard,
          {
            "0": {
              alpha: 1,
              "scale.x": 1 * baseScale,
              "scale.y": 1 * baseScale,
            },
            "0.5": {
              alpha: 1.1,
              "scale.x": 1.1 * baseScale,
              "scale.y": 1.1 * baseScale,
            },
            "1": {
              alpha: 0,
              "scale.x": 1.1 * baseScale,
              "scale.y": 1.1 * baseScale,
            },
          },
          0.12
        )
      }
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        this.standard.tint = 0xffffff
        BezierAnimator.finish(this.standardAnim)
        this.standardAnim = BezierAnimator.animate(
          this.standard,
          {
            "0": {
              alpha: 1,
              "scale.x": 1 * baseScale,
              "scale.y": 1 * baseScale,
            },
            "0.5": {
              alpha: 1.1,
              "scale.x": 1.1 * baseScale,
              "scale.y": 1.1 * baseScale,
            },
            "1": {
              alpha: 0,
              "scale.x": 1.1 * baseScale,
              "scale.y": 1.1 * baseScale,
            },
          },
          0.12
        )
      }
    })

    noteskin.on(this, "holdon", event => {
      if (col == event.columnNumber) {
        this.standard.alpha = 1
      }
    })

    noteskin.on(this, "holdoff", event => {
      if (col == event.columnNumber) {
        this.standard.alpha = 0
      }
    })

    noteskin.on(this, "rollon", event => {
      if (col == event.columnNumber) {
        this.standard.alpha = 1
      }
    })

    noteskin.on(this, "rolloff", event => {
      if (col == event.columnNumber) {
        this.standard.alpha = 0
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

    this.standard.alpha = 0
    this.standard.anchor.set(0.5)
    this.addChild(this.standard)
  }
}
