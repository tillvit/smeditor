// SLNEXXT-vivid, bundled with the DanceDanceRevolution XX -STARLiGHT- theme, from https://github.com/MidflightDigital/STARLiGHT-NEXXT

import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"

import { NoteFlashContainer } from "./NoteFlash"
import { NoteRenderer } from "./NoteRenderer"

import bezier from "bezier-easing"
import { BezierAnimator } from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/PixiUtil"

import { HoldBody } from "../../_template/HoldBody"
import { HoldTail } from "../../_template/HoldTail"
import mineUrl from "./mine/mine.png"
import sparkUrl from "./mine/spark.png"
import receptorUrl from "./receptor.png"
import receptorFlashUrl from "./receptorFlash.png"

const receptorTex = Texture.from(receptorUrl)
const receptorFlashTex = Texture.from(receptorFlashUrl)

const mineTex = Texture.from(mineUrl)
const sparkTex = splitTex(Texture.from(sparkUrl), 4, 4, 160, 128).flat()

const sparkOffsets: Record<string, number> = {
  Left: 0,
  Down: 5,
  Up: 8,
  Right: 13,
}

const holdTex: Record<string, Record<string, Record<string, Texture>>> = {}
const rollTex: Record<string, Record<string, Record<string, Texture>>> = {}

const headTex = {
  Hold: {
    Active: Texture.from(new URL(`./hold/active.png`, import.meta.url).href),
    Inactive: Texture.from(
      new URL(`./hold/inactive.png`, import.meta.url).href
    ),
  },
  Roll: {
    Active: Texture.from(new URL(`./roll/active.png`, import.meta.url).href),
    Inactive: Texture.from(
      new URL(`./roll/inactive.png`, import.meta.url).href
    ),
  },
}

for (const dir of ["Left", "Down", "Up", "Right"]) {
  for (const asset of ["Body", "BottomCap"]) {
    for (const state of ["Active", "Inactive"]) {
      if (holdTex[dir] === undefined) holdTex[dir] = {}
      if (holdTex[dir][state] === undefined) holdTex[dir][state] = {}
      holdTex[dir][state][asset] = Texture.from(
        new URL(
          `./hold/${dir.toLowerCase()}${asset}${state}.png`,
          import.meta.url
        ).href
      )

      if (rollTex[dir] === undefined) rollTex[dir] = {}
      if (rollTex[dir][state] === undefined) rollTex[dir][state] = {}
      rollTex[dir][state][asset] = Texture.from(
        new URL(
          `./roll/${dir.toLowerCase()}${asset}${state}.png`,
          import.meta.url
        ).href
      )
    }
  }
}

export const rotationMap: Record<string, number> = {
  Left: 90,
  Down: 0,
  Up: 180,
  Right: -90,
}

const toRotate = [
  "Receptor",
  "Tap",
  "Lift",
  "Fake",
  "Hold Inactive Head",
  "Hold Active Head",
  "Roll Inactive Head",
  "Roll Active Head",
  "NoteFlash",
]

export default {
  elements: {
    Left: {
      Receptor: options => {
        let zoomanim: string | undefined
        let pressanim: string | undefined
        const tex = splitTex(receptorTex, 2, 1, 404, 404)

        const container = new Container()

        const spr = new AnimatedSprite(tex[0])
        spr.width = 64
        spr.height = 64
        spr.anchor.set(0.5)
        options.noteskin.on(spr, "ghosttap", opt => {
          if (opt.columnNumber == options.columnNumber) {
            BezierAnimator.finish(zoomanim)
            zoomanim = BezierAnimator.animate(
              spr,
              {
                "0": {
                  alpha: 0.9,
                  width: 0.85 * 64,
                  height: 0.85 * 64,
                },
                "1": {
                  alpha: 1,
                  width: 64,
                  height: 64,
                },
              },
              0.11
            )
          }
        })

        const flash = new Sprite(receptorFlashTex)
        flash.blendMode = BLEND_MODES.ADD
        flash.width = 64
        flash.height = 64
        flash.anchor.set(0.5)
        flash.alpha = 0

        options.noteskin.on(container, "press", opt => {
          if (opt.columnNumber == options.columnNumber) {
            BezierAnimator.finish(pressanim)
            pressanim = BezierAnimator.animate(
              flash,
              {
                "0": {
                  alpha: 0,
                  width: 0.85 * 64,
                  height: 0.85 * 64,
                },
                "1": {
                  alpha: 0.6,
                  width: 64,
                  height: 64,
                },
              },
              0.12,
              bezier(0.5, 1, 0.89, 1)
            )
          }
        })

        options.noteskin.on(container, "lift", opt => {
          if (opt.columnNumber == options.columnNumber) {
            BezierAnimator.finish(pressanim)
            pressanim = BezierAnimator.animate(
              flash,
              {
                "0": {
                  alpha: "inherit",
                  width: "inherit",
                  height: "inherit",
                },
                "1": {
                  alpha: 0,
                  width: 64 * 1.2,
                  height: 64,
                },
              },
              0.12,
              bezier(0.11, 0, 0.5, 1)
            )
          }
        })

        options.noteskin.onUpdate(container, r => {
          const firstBeat = r.chart.getNotedata()[0]?.beat
          if (firstBeat === undefined || r.getVisualBeat() < firstBeat - 8) {
            spr.currentFrame = 1
            return
          }
          const partialBeat = ((r.getVisualBeat() % 1) + 1) % 1
          spr.currentFrame = partialBeat < 0.2 ? 0 : 1
        })

        container.addChild(spr, flash)

        return container
      },
      Tap: options => {
        const spr = new Sprite(Texture.WHITE)
        NoteRenderer.setNoteTex(spr, options.note)
        spr.anchor.set(0.5)
        return spr
      },
      NoteFlash: options => {
        return new NoteFlashContainer(
          options.noteskin,
          options.columnNumber,
          options.columnName
        )
      },
      Fake: { element: "Tap" },
      Lift: { element: "Tap" },
      Mine: opt => {
        const container = new Container()
        const spr = new Sprite(mineTex)
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        spr.rotation = (rotationMap[opt.columnName] * Math.PI) / 180

        const spark = new AnimatedSprite(sparkTex)
        spark.anchor.set(0.5)
        spark.scale.set(0.5)

        container.addChild(spr, spark)

        opt.noteskin.onUpdate(container, r => {
          const second = r.getVisualTime()
          spark.currentFrame =
            (((Math.floor(second * 20) + sparkOffsets[opt.columnName]) % 16) +
              16) %
            16
        })

        return container
      },
      "Hold Active Head": () => {
        const spr = new Sprite(headTex.Hold.Active)
        spr.anchor.set(0.5)
        spr.scale.set(1 / 6)
        return spr
      },
      "Hold Inactive Head": () => {
        const spr = new Sprite(headTex.Hold.Inactive)
        spr.anchor.set(0.5)
        spr.scale.set(1 / 6)
        return spr
      },
      "Hold Active Body": opt =>
        new HoldBody(holdTex[opt.columnName].Active.Body),
      "Hold Inactive Body": opt =>
        new HoldBody(holdTex[opt.columnName].Inactive.Body),
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": opt =>
        new HoldTail(holdTex[opt.columnName].Active.BottomCap),
      "Hold Inactive BottomCap": opt =>
        new HoldTail(holdTex[opt.columnName].Inactive.BottomCap),

      "Roll Active Head": () => {
        const spr = new Sprite(headTex.Roll.Active)
        spr.anchor.set(0.5)
        spr.scale.set(1 / 6)
        return spr
      },
      "Roll Inactive Head": () => {
        const spr = new Sprite(headTex.Roll.Inactive)
        spr.anchor.set(0.5)
        spr.scale.set(1 / 6)
        return spr
      },
      "Roll Active Body": opt =>
        new HoldBody(rollTex[opt.columnName].Active.Body),
      "Roll Inactive Body": opt =>
        new HoldBody(rollTex[opt.columnName].Inactive.Body),
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": opt =>
        new HoldTail(rollTex[opt.columnName].Active.BottomCap),
      "Roll Inactive BottomCap": opt =>
        new HoldTail(rollTex[opt.columnName].Inactive.BottomCap),
    },
  },
  load: function (element, options) {
    const col = element.columnName
    element.columnName = "Left"

    const sprite = this.loadElement(element, options)

    if (toRotate.includes(element.element)) {
      sprite.rotation = (rotationMap[col] * Math.PI) / 180
    }

    return sprite
  },
  init() {
    NoteRenderer.initArrowTex()
  },
  update(renderer) {
    NoteRenderer.setArrowTexTime(renderer.chartManager.app)
  },
  metrics: {
    HoldBodyBottomOffset: -16,
    RollBodyBottomOffset: -16,
  },
} satisfies NoteskinOptions
