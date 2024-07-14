// Pastel by halcyoniix
// Custom lifts by tillvit

import { AnimatedSprite, Sprite, Texture, TilingSprite } from "pixi.js"
import { NoteSkinOptions } from "../../NoteSkin"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { ModelRenderer } from "./ModelRenderer"
import { NoteFlashContainer } from "./NoteFlash"
import receptorUrl from "./receptor.png"

import rollBodyUrl from "./roll/body.png"
import rollCapUrl from "./roll/cap.png"

import { splitTex } from "../../../../../util/Util"
import holdBodyUrl from "./hold/body.png"
import holdCapUrl from "./hold/cap.png"

const receptorTex = Texture.from(receptorUrl)

const tapTex: Texture[] = []

for (let i = 0; i < 9; i++) {
  tapTex[i] = Texture.from(new URL(`./tap/${i}.png`, import.meta.url).href)
}

const liftTex: Texture[] = []

for (let i = 0; i < 9; i++) {
  liftTex[i] = Texture.from(new URL(`./lift/${i}.png`, import.meta.url).href)
}

const holdTex = {
  hold: {
    body: Texture.from(holdBodyUrl),
    cap: Texture.from(holdCapUrl),
  },
  roll: {
    body: Texture.from(rollBodyUrl),
    cap: Texture.from(rollCapUrl),
  },
}

const rotationMap: Record<string, number> = {
  Left: 90,
  Down: 0,
  Up: 180,
  Right: -90,
  UpLeft: 135,
  UpRight: -135,
  DownRight: -45,
  DownLeft: 45,
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

const holdBody = (tex: Texture) => {
  const body = new TilingSprite(tex, 64, 0)
  body.tileScale.x = 0.5
  body.tileScale.y = 0.5
  body.uvRespectAnchor = true
  body.anchor.y = 1
  body.x = -32
  return body
}

const holdCap = (tex: Texture) => {
  const cap = new Sprite(tex)
  cap.width = 64
  cap.height = 32
  cap.anchor.x = 0.5
  return cap
}

export default {
  elements: {
    Left: {
      Receptor: options => {
        let zoomanim: string | undefined
        const spr = new AnimatedSprite(splitTex(receptorTex, 2, 1, 128, 128)[0])
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
            [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
              options.note?.quant ?? 4
            ) ?? 0
          ]
        const spr = new Sprite(tex)
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
            [4, 8, 12, 16, 24, 32, 48, 64, 96, 192].indexOf(
              options.note?.quant ?? 4
            ) ?? 0
          ]
        const spr = new Sprite(tex)
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        return spr
      },
      Mine: () => {
        const spr = new Sprite(ModelRenderer.mineTex)
        spr.anchor.set(0.5)
        spr.width = 64
        spr.height = 64
        return spr
      },
      "Hold Active Head": { element: "Tap" },
      "Hold Inactive Head": { element: "Tap" },
      "Hold Active Body": () => holdBody(holdTex.hold.body),
      "Hold Inactive Body": { element: "Hold Active Body" },
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": () => holdCap(holdTex.hold.cap),
      "Hold Inactive BottomCap": { element: "Hold Active BottomCap" },

      "Roll Active Head": { element: "Tap" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => holdBody(holdTex.roll.body),
      "Roll Inactive Body": { element: "Roll Active Body" },
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": () => holdCap(holdTex.roll.cap),
      "Roll Inactive BottomCap": { element: "Roll Active BottomCap" },
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
    ModelRenderer.initArrowTex()
  },
  update(renderer) {
    ModelRenderer.setArrowTexTime(renderer.chartManager.app)
  },
} satisfies NoteSkinOptions
