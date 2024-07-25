import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { Noteskin } from "../../Noteskin"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/Util"
import flashUrl from "./flash/flash.png"
import mineUrl from "./flash/mine.png"
import pressUrl from "./flash/press.png"
import { tapTex } from "./NoteRenderer"
import { texOrder } from "./Noteskin"

const flashTex = splitTex(Texture.from(flashUrl), 5, 1, 128, 128)[0]
const mineTex = Texture.from(mineUrl)

const pressTex = splitTex(Texture.from(pressUrl), 5, 2, 96, 96)

const doJudge = ["w0", "w1", "w2", "w3"]

export class NoteFlashContainer extends Container {
  press
  pressAnim: string | undefined

  hitContainer = new Container()

  tap
  note
  flash

  hitAnim: string | undefined

  anims = new Set<string>()

  constructor(noteskin: Noteskin, colName: string, col: number) {
    super()

    const baseScale = 1 / 1.5

    this.press = new Sprite(pressTex[1][texOrder.indexOf(colName)])
    this.press.alpha = 0
    this.press.anchor.set(0.5)

    this.tap = new Sprite(pressTex[0][texOrder.indexOf(colName)])
    this.tap.blendMode = BLEND_MODES.ADD
    this.tap.scale.set(baseScale)
    this.tap.anchor.set(0.5)

    this.note = new AnimatedSprite(tapTex[colName])
    this.note.scale.set(baseScale)
    this.note.blendMode = BLEND_MODES.ADD
    this.note.animationSpeed = 1 / 3
    this.note.play()
    this.note.anchor.set(0.5)

    this.flash = new AnimatedSprite(flashTex)
    this.flash.scale.set(2)
    this.flash.blendMode = BLEND_MODES.ADD
    this.flash.animationSpeed = 1 / 3
    this.flash.loop = false
    this.flash.visible = false
    this.flash.anchor.set(0.5)
    this.flash.onComplete = () => {
      this.flash.visible = false
      this.flash.stop()
    }

    this.hitContainer.alpha = 0
    this.hitContainer.addChild(this.tap, this.note)

    noteskin.on(this, "ghosttap", event => {
      if (col == event.columnNumber) {
        BezierAnimator.finish(this.pressAnim)
        this.pressAnim = BezierAnimator.animate(
          this.press,
          {
            "0": {
              alpha: 1,
              "scale.x": 1 * baseScale,
              "scale.y": 1 * baseScale,
            },
            "1": {
              alpha: 0,
              "scale.x": 1.3 * baseScale,
              "scale.y": 1.3 * baseScale,
            },
          },
          0.25
        )
      }
    })

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        if (!doJudge.includes(event.judgement.id)) return
        BezierAnimator.finish(this.pressAnim)
        BezierAnimator.finish(this.hitAnim)
        this.hitAnim = BezierAnimator.animate(
          this.hitContainer,
          {
            "0": {
              alpha: 1,
              "scale.x": 1,
              "scale.y": 1,
            },
            "1": {
              alpha: 0,
              "scale.x": 1.2,
              "scale.y": 1.2,
            },
          },
          0.4
        )
        this.flash.visible = true
        this.flash.currentFrame = 0
        this.flash.play()
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

    this.addChild(this.press, this.hitContainer, this.flash)
  }
}
