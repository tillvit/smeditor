import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { Noteskin } from "../../Noteskin"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/PixiUtil"
import holdUrl from "./flash/hold.png"
import mineUrl from "./flash/mine.png"

const holdTex = Texture.from(holdUrl)
const mineTex = Texture.from(mineUrl)

export class NoteFlashContainer extends Container {
  hold = new AnimatedSprite(splitTex(holdTex, 2, 1, 72, 128)[0])

  anims = new Set<string>()

  constructor(noteskin: Noteskin, col: number) {
    super()

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

    noteskin.onUpdate(this, () => {
      this.hold.alpha =
        Math.sin((Date.now() / 1000) * Math.PI * 2 * 20) * 0.1 + 1
    })

    this.hold.visible = false
    this.hold.anchor.set(0.5)

    this.addChild(this.hold)
  }
}
