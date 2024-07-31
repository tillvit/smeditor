import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { Noteskin } from "../../Noteskin"

import bezier from "bezier-easing"
import { BezierAnimator } from "../../../../../util/BezierEasing"
import flashUrl from "./flash/flash.png"
import mineUrl from "./flash/mine.png"

const flashTex = Texture.from(flashUrl)
const mineTex = Texture.from(mineUrl)

export class NoteFlashContainer extends Container {
  standard = new Sprite(flashTex)
  hold = new Sprite(flashTex)

  anims = new Set<string>()

  constructor(noteskin: Noteskin, col: number) {
    super()
    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            this.standard,
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
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            this.standard,
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
        )
      }
    })

    noteskin.on(this, "holdon", event => {
      if (col == event.columnNumber) {
        this.hold.visible = true
      }
    })

    noteskin.on(this, "holdoff", event => {
      if (col == event.columnNumber) {
        this.hold.visible = false
      }
    })

    noteskin.on(this, "rollon", event => {
      if (col == event.columnNumber) {
        this.hold.visible = true
      }
    })

    noteskin.on(this, "rolloff", event => {
      if (col == event.columnNumber) {
        this.hold.visible = false
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

    noteskin.onUpdate(this, () => {
      this.hold.alpha =
        Math.sin((Date.now() / 1000) * Math.PI * 2 * 20) * 0.1 + 1
    })

    this.hold.visible = false
    this.hold.anchor.set(0.5)
    this.addChild(this.hold)
  }
}
