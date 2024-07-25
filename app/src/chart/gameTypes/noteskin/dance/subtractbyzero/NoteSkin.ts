// SubtractByZero, bundled with Etterna
// Custom lifts by tillvit

import { AnimatedSprite, Sprite, Texture, TilingSprite } from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"

import { BezierAnimator } from "../../../../../util/BezierEasing"

import { NoteFlashContainer } from "./NoteFlash"

import { splitTex } from "../../../../../util/Util"

import rollBodyUrl from "./rollBody.png"

import holdBodyUrl from "./holdBody.png"

import holdHeadUrl from "./holdHead.png"
import liftUrl from "./lift.png"
import mineUrl from "./mine.png"
import receptorUrl from "./receptor.png"
import tapUrl from "./tap.png"

const receptorTex = splitTex(Texture.from(receptorUrl), 2, 1, 64, 64)[0]

const mineTex = splitTex(Texture.from(mineUrl), 8, 1, 64, 64)[0]

const tapTex = splitTex(Texture.from(tapUrl), 1, 8, 64, 64)
const holdHeadTex = splitTex(Texture.from(holdHeadUrl), 1, 8, 64, 64)

const liftTex = splitTex(Texture.from(liftUrl), 1, 8, 64, 64)

const holdTex = Texture.from(holdBodyUrl)
const rollTex = Texture.from(rollBodyUrl)

const holdBody = (tex: Texture) => {
  const body = new TilingSprite(tex, 64, 0)
  body.tileScale.x = 1
  body.tileScale.y = 1
  body.uvRespectAnchor = true
  body.anchor.y = 1
  body.x = -32
  return body
}

export default {
  elements: {
    Left: {
      Receptor: options => {
        let zoomanim: string | undefined
        const spr = new AnimatedSprite(receptorTex)
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
                  alpha: 1.2,
                  width: 48,
                  height: 48,
                },
                "1": {
                  alpha: 1,
                  width: 64,
                  height: 64,
                },
              },
              0.06
            )
          }
        })
        options.noteskin.onUpdate(spr, r => {
          const partialBeat = ((r.getVisualBeat() % 1) + 1) % 1
          spr.currentFrame = partialBeat < 0.2 ? 0 : 1
        })
        return spr
      },
      Tap: options => {
        const tex =
          tapTex[
            Math.min(
              [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
                options.note?.quant ?? 4
              ) ?? 0,
              7
            )
          ]
        const spr = new Sprite(tex[0])
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        return spr
      },
      NoteFlash: options => {
        return new NoteFlashContainer(options.noteskin, options.columnNumber)
      },
      Fake: { element: "Tap" },
      Lift: options => {
        const tex =
          liftTex[
            Math.min(
              [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
                options.note?.quant ?? 4
              ) ?? 0,
              7
            )
          ]
        const spr = new Sprite(tex[0])
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        return spr
      },
      Mine: opt => {
        const spr = new AnimatedSprite(mineTex)
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        opt.noteskin.onUpdate(
          spr,
          r =>
            (spr.currentFrame = Math.floor(
              (((r.getVisualBeat() % 4) + 4) % 4) * 2
            ))
        )
        return spr
      },
      "Hold Active Head": options => {
        const tex =
          holdHeadTex[
            Math.min(
              [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
                options.note?.quant ?? 4
              ) ?? 0,
              7
            )
          ]
        const spr = new Sprite(tex[0])
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        return spr
      },
      "Hold Inactive Head": { element: "Tap" },
      "Hold Active Body": () => holdBody(holdTex),
      "Hold Inactive Body": { element: "Hold Active Body" },
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive BottomCap": { element: "Hold Active BottomCap" },

      "Roll Active Head": { element: "Hold Active Head" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => holdBody(rollTex),
      "Roll Inactive Body": { element: "Roll Active Body" },
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive BottomCap": { element: "Roll Active BottomCap" },
    },
  },
  load: function (element, options) {
    element.columnName = "Left"

    const sprite = this.loadElement(element, options)

    return sprite
  },
  hideIcons: ["Lift"],
} satisfies NoteskinOptions
