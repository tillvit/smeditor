// SM4 Bold, bundled with SM4

import { Sprite, Texture, TilingSprite } from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"
import { NoteRenderer } from "./NoteRenderer"

import cReceptor from "./centerReceptor.png"
import dlReceptor from "./downLeftReceptor.png"

import holdBodyActiveUrl from "./hold/bodyActive.png"
import holdBodyInactiveUrl from "./hold/bodyInactive.png"
import holdCapActiveUrl from "./hold/capActive.png"
import holdCapInactiveUrl from "./hold/capInactive.png"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { rgbtoHex } from "../../../../../util/Color"
import { NoteFlashContainer } from "./NoteFlash"
import rollBodyActiveUrl from "./roll/bodyActive.png"
import rollBodyInactiveUrl from "./roll/bodyInactive.png"
import rollCapActiveUrl from "./roll/capActive.png"
import rollCapInactiveUrl from "./roll/capInactive.png"

const dlReceptorTex = Texture.from(dlReceptor)
const cReceptorTex = Texture.from(cReceptor)

const holdTex = {
  hold: {
    active: {
      body: Texture.from(holdBodyActiveUrl),
      cap: Texture.from(holdCapActiveUrl),
    },
    inactive: {
      body: Texture.from(holdBodyInactiveUrl),
      cap: Texture.from(holdCapInactiveUrl),
    },
  },
  roll: {
    active: {
      body: Texture.from(rollBodyActiveUrl),
      cap: Texture.from(rollCapActiveUrl),
    },
    inactive: {
      body: Texture.from(rollBodyInactiveUrl),
      cap: Texture.from(rollCapInactiveUrl),
    },
  },
}
const rotationMap: Record<string, number> = {
  Center: 0,
  DownLeft: 0,
  UpLeft: 90,
  UpRight: 180,
  DownRight: 270,
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
]

const holdBody = (tex: Texture) => {
  const body = new TilingSprite(tex, 64, 0)
  body.tileScale.x = 0.5
  body.tileScale.y = 0.5
  body.uvRespectAnchor = true
  body.anchor.y = 1
  body.x = -32
  return body
}

const holdCap = (tex: Texture, reverse = false) => {
  const cap = new Sprite(tex)
  cap.width = 64
  cap.height = 32
  cap.anchor.x = 0.5
  if (reverse) {
    cap.height = -32
  }
  return cap
}

export default {
  elements: {
    DownLeft: {
      Receptor: options => {
        const spr = new Sprite(
          options.columnName == "Center" ? cReceptorTex : dlReceptorTex
        )
        spr.width = 72
        spr.height = 72
        spr.anchor.set(0.5)

        let zoomanim: string | undefined
        options.noteskin.on(spr, "ghosttap", opt => {
          if (opt.columnNumber == options.columnNumber) {
            BezierAnimator.finish(zoomanim)
            zoomanim = BezierAnimator.animate(
              spr,
              {
                "0": {
                  width: 54,
                  height: 54,
                },
                "1": {
                  width: 72,
                  height: 72,
                },
              },
              0.11
            )
          }
        })

        options.noteskin.onUpdate(spr, r => {
          const beat = r.getVisualBeat()
          let brightness = 204
          if (((beat % 1) + 1) % 1 > 0.2) brightness = 102
          spr.tint = rgbtoHex(brightness, brightness, brightness)
        })
        return spr
      },
      Tap: options => {
        const spr = new Sprite(Texture.WHITE)
        NoteRenderer.setNoteTex(spr, options.note, options.columnName)
        spr.anchor.set(0.5)
        spr.width = 72
        spr.height = 72
        return spr
      },
      Fake: { element: "Tap" },
      Lift: { element: "Tap" },
      Mine: { element: "Tap" },
      NoteFlash: options =>
        new NoteFlashContainer(options.noteskin, options.columnNumber),
      "Hold Active Head": { element: "Tap" },
      "Hold Inactive Head": { element: "Tap" },
      "Hold Active Body": () => holdBody(holdTex.hold.active.body),
      "Hold Inactive Body": () => holdBody(holdTex.hold.inactive.body),
      "Hold Active TopCap": () => holdCap(holdTex.hold.active.cap, true),
      "Hold Inactive TopCap": () => holdCap(holdTex.hold.inactive.cap, true),
      "Hold Active BottomCap": () => holdCap(holdTex.hold.active.cap),
      "Hold Inactive BottomCap": () => holdCap(holdTex.hold.inactive.cap),

      "Roll Active Head": { element: "Tap" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => holdBody(holdTex.roll.active.body),
      "Roll Inactive Body": () => holdBody(holdTex.roll.inactive.body),
      "Roll Active TopCap": () => holdCap(holdTex.roll.active.cap, true),
      "Roll Inactive TopCap": () => holdCap(holdTex.roll.inactive.cap, true),
      "Roll Active BottomCap": () => holdCap(holdTex.roll.active.cap),
      "Roll Inactive BottomCap": () => holdCap(holdTex.roll.inactive.cap),
    },
  },
  load: function (element, options) {
    const col = element.columnName

    element.columnName = "DownLeft"

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
  hideIcons: ["Lift", "Fake"],
} satisfies NoteskinOptions
