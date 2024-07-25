import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { Noteskin } from "../../Noteskin"

import bezier from "bezier-easing"
import { BezierAnimator } from "../../../../../util/BezierEasing"
import w4Url from "./flash/decent.png"
import w2Url from "./flash/excellent.png"
import w0Url from "./flash/fantastic.png"
import w3Url from "./flash/great.png"
import holdFlashUrl from "./flash/hold.png"
import mineUrl from "./flash/mine.png"
import w5Url from "./flash/way_off.png"
import w1Url from "./flash/white_fantastic.png"

const flashTex = {
  hold: Texture.from(holdFlashUrl),
  w0: Texture.from(w0Url),
  w1: Texture.from(w1Url),
  w2: Texture.from(w2Url),
  w3: Texture.from(w3Url),
  w4: Texture.from(w4Url),
  w5: Texture.from(w5Url),
  mine: Texture.from(mineUrl),
}

export class NoteFlashContainer extends Container {
  holdExplosion = new Sprite(flashTex.hold)
  standard: Record<string, Sprite> = {
    w0: new Sprite(flashTex.w0),
    w1: new Sprite(flashTex.w1),
    w2: new Sprite(flashTex.w2),
    w3: new Sprite(flashTex.w3),
    w4: new Sprite(flashTex.w4),
    w5: new Sprite(flashTex.w5),
  }

  anims = new Set<string>()

  constructor(noteskin: Noteskin, col: number) {
    super()
    this.scale.set(0.5)

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        if (this.standard[event.judgement.id]) {
          this.anims.forEach(anim => BezierAnimator.finish(anim))
          this.anims.clear()
          const obj = this.standard[event.judgement.id]
          this.anims.add(
            BezierAnimator.animate(
              obj,
              {
                "0": {
                  alpha: 1.2,
                  "scale.x": 1.1,
                  "scale.y": 1.1,
                },
                "1": {
                  alpha: 0,
                  "scale.x": 1,
                  "scale.y": 1,
                },
              },
              0.15,
              bezier(0.11, 0, 0.5, 0)
            )
          )
        }
      }
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        const obj = this.standard.w2
        BezierAnimator.animate(
          obj,
          {
            "0": {
              alpha: 1.2,
              "scale.x": 1.1,
              "scale.y": 1.1,
            },
            "1": {
              alpha: 0,
              "scale.x": 1,
              "scale.y": 1,
            },
          },
          0.09,
          bezier(0.11, 0, 0.5, 0)
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
        const mine = new Sprite(flashTex.mine)
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
      this.holdExplosion.alpha =
        Math.sin((Date.now() / 1000) * Math.PI * 2 * 20) * 0.1 + 1
    })

    this.holdExplosion.visible = false
    this.holdExplosion.anchor.set(0.5)
    this.addChild(this.holdExplosion)
    for (const item of Object.values(this.standard)) {
      item.alpha = 0
      item.anchor.set(0.5)
      this.addChild(item)
    }
  }
}
