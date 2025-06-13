import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { Noteskin } from "../../Noteskin"

import { BezierAnimator } from "../../../../../util/BezierEasing"

import bezier from "bezier-easing"
import { Options } from "../../../../../util/Options"
import { splitTex } from "../../../../../util/PixiUtil"
import holdFlashUrl from "./flash/hold.png"
import mineUrl from "./flash/mine.png"
import particleUrl from "./flash/particles.png"
import { rotationMap } from "./Noteskin"

const holdTex = Texture.from(holdFlashUrl)
const mineTex = splitTex(Texture.from(mineUrl), 16, 1, 160, 1024)[0]
const particleTex = Texture.from(particleUrl)

const judges = ["w0", "w1", "w2", "w3", "w4", "w5"]

const tex: Record<string, Texture> = {}
judges.forEach(
  name =>
    (tex[name] = Texture.from(
      new URL(`./flash/${name}.png`, import.meta.url).href
    ))
)

export class NoteFlashContainer extends Container {
  holdExplosion = new Sprite(holdTex)
  particles = new Sprite(particleTex)
  mine = new AnimatedSprite(mineTex)
  standard: Record<string, Sprite> = {}

  anims = new Set<string>()
  particleAnim?: string
  mineAnim?: string

  constructor(noteskin: Noteskin, col: number, columnName: string) {
    super()

    const baseScale = 0.5

    judges.forEach(name => {
      const spr = new Sprite(tex[name])
      spr.anchor.set(0.5)
      spr.alpha = 0
      spr.blendMode = BLEND_MODES.ADD
      this.standard[name] = spr
      this.addChild(spr)
    })

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        const target = this.standard[event.judgement.id]
        if (!target) return
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            target,
            {
              "0": {
                alpha: 0.875,
                "scale.x": 0.8 * baseScale,
                "scale.y": 0.8 * baseScale,
              },
              "0.5": {
                alpha: 0.875,
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
        )
      }
    })

    noteskin.on(this, "held", event => {
      if (col == event.columnNumber) {
        this.anims.forEach(anim => BezierAnimator.finish(anim))
        this.anims.clear()
        this.anims.add(
          BezierAnimator.animate(
            this.standard.w0,
            {
              "0": {
                alpha: 0.875,
                "scale.x": 0.8 * baseScale,
                "scale.y": 0.8 * baseScale,
              },
              "0.5": {
                alpha: 0.875,
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

    noteskin.onUpdate(this, () => {
      this.holdExplosion.alpha =
        Math.sin((Date.now() / 1000) * Math.PI * 2 * 20) * 0.1 + 1
    })

    this.holdExplosion.visible = false
    this.holdExplosion.anchor.set(0.5)
    this.holdExplosion.scale.set(0.5)
    this.addChild(this.holdExplosion)

    this.particles.alpha = 0
    this.particles.blendMode = BLEND_MODES.ADD
    this.particles.anchor.set(0.5)

    noteskin.on(this, "hit", event => {
      if (col == event.columnNumber) {
        this.particles.rotation = Math.random() * Math.PI * 2
        BezierAnimator.finish(this.particleAnim)
        if (!["w0", "w1", "w2", "w3"].includes(event.judgement.id)) return
        this.particleAnim = BezierAnimator.animate(
          this.particles,
          {
            "0": {
              alpha: 0.6,
              "scale.x": 1 * baseScale,
              "scale.y": 1 * baseScale,
            },
            "0.7": {
              alpha: 0.6,
              "scale.x": 1.2 * baseScale,
              "scale.y": 1.2 * baseScale,
            },
            "1": {
              alpha: 0,
              "scale.x": 1.2 * baseScale,
              "scale.y": 1.2 * baseScale,
            },
          },
          0.185,
          bezier(0.16, 0.73, 0.63, 0.75)
        )
      }
    })

    this.addChild(this.particles)

    this.mine.anchor.x = 0.5
    this.mine.scale.set(0.5)
    this.mine.rotation = (-rotationMap[columnName] * Math.PI) / 180
    this.mine.animationSpeed = 1 / 3
    this.mine.alpha = 0
    this.addChild(this.mine)

    noteskin.on(this, "hitmine", event => {
      if (col == event.columnNumber) {
        BezierAnimator.finish(this.mineAnim)
        this.mine.anchor.y = Options.chart.reverse ? 1 : 0
        this.mine.currentFrame = 0
        this.mine.play()
        this.mineAnim = BezierAnimator.animate(
          this.mine,
          {
            "0": {
              alpha: 1,
            },
            "0.5": {
              alpha: 1,
            },
            "1": {
              alpha: 0,
            },
          },
          0.6
        )
      }
    })
  }
}
