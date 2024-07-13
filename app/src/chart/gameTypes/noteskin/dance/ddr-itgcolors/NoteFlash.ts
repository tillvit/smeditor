import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { NoteSkin } from "../../NoteSkin"

import {
  BezierAnimator,
  BezierKeyFrames,
} from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/Util"

import brightUrl from "./flash/flashBright.png"
import dimUrl from "./flash/flashDim.png"
import holdFlashUrl from "./flash/hold.png"
import mineUrl from "./flash/mine.png"

const brightTex = Texture.from(brightUrl)
const dimTex = Texture.from(dimUrl)
const holdTex = Texture.from(holdFlashUrl)
const mineTex = Texture.from(mineUrl)

const bright: BezierKeyFrames = {
  "0": {
    tint: 0xffffff,
    alpha: 1,
    "scale.x": 0.8,
    "scale.y": 0.8,
  },
  "0.5": {
    tint: 0xffffff,
    alpha: 1,
    "scale.x": 1,
    "scale.y": 1,
  },
  "1": {
    tint: 0xffffff,
    alpha: 0,
    "scale.x": 1,
    "scale.y": 1,
  },
}

const dim = (tint: number) => {
  return {
    "0": {
      tint,
      alpha: 1,
      "scale.x": 0.4,
      "scale.y": 0.4,
    },
    "0.5": {
      tint,
      alpha: 1,
      "scale.x": 0.5,
      "scale.y": 0.5,
    },
    "1": {
      tint,
      alpha: 0,
      "scale.x": 0.5,
      "scale.y": 0.5,
    },
  }
}

const animations: Record<string, BezierKeyFrames> = {
  w0: bright,
  w1: bright,
  w2: dim(0xffff4c),
  w3: dim(0x00ff66),
  held: bright,
}

export class NoteFlashContainer extends Container {
  holdExplosion = new AnimatedSprite(splitTex(holdTex, 4, 1, 160, 160)[0])
  bright = new Sprite(brightTex)
  dim = new Sprite(dimTex)

  anims = new Set<string>()

  constructor(noteskin: NoteSkin, col: number) {
    super()

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        let target = this.dim
        if (event.judgement.id == "w0") {
          target = this.bright
        }
        if (animations[event.judgement.id] === undefined) return
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(target, animations[event.judgement.id], 0.12)
        )
      }
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(this.bright, animations.held, 0.12)
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

    this.holdExplosion.visible = false
    this.holdExplosion.anchor.set(0.5)
    this.holdExplosion.scale.set(0.5)
    this.holdExplosion.play()
    this.addChild(this.holdExplosion)

    this.dim.scale.set(0.5)
    this.dim.anchor.set(0.5)
    this.dim.alpha = 0
    this.addChild(this.dim)

    this.bright.scale.set(0.5)
    this.bright.anchor.set(0.5)
    this.bright.alpha = 0
    this.addChild(this.bright)
  }
}
