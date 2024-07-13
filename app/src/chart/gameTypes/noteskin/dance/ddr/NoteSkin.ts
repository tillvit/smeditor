// Peters-DDR-Note by Pete-Lawrence https://github.com/Pete-Lawrence/Peters-Noteskins/

import { AnimatedSprite, Sprite, Texture, TilingSprite } from "pixi.js"
import { NoteSkinOptions } from "../../NoteSkin"

import { ModelRenderer } from "./ModelRenderer"
import { NoteFlashContainer } from "./NoteFlash"
import receptorUrl from "./receptor.png"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/Util"

const receptorTex = Texture.from(receptorUrl)

const holdTex: Record<string, Record<string, Record<string, Texture>>> = {}
const rollTex: Record<string, Record<string, Texture>> = {}

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
    }
  }
}

for (const asset of ["body", "bottomCap"]) {
  for (const state of ["Active", "Inactive"]) {
    if (rollTex[state] === undefined) rollTex[state] = {}
    rollTex[state][asset] = Texture.from(
      new URL(`./roll/${asset}${state}.png`, import.meta.url).href
    )
  }
}

const rotationMap: Record<string, number> = {
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
        const tex = splitTex(receptorTex, 2, 1, 256, 256)

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
        const spr = new Sprite(Texture.WHITE)
        ModelRenderer.setNoteTex(spr, options.note)
        spr.anchor.set(0.5)
        return spr
      },
      NoteFlash: options => {
        return new NoteFlashContainer(options.noteskin, options.columnNumber)
      },
      Fake: { element: "Tap" },
      Lift: { element: "Tap" },
      Mine: { element: "Tap" },
      "Hold Active Head": { element: "Tap" },
      "Hold Inactive Head": { element: "Tap" },
      "Hold Active Body": opt => holdBody(holdTex[opt.columnName].Active.Body),
      "Hold Inactive Body": opt =>
        holdBody(holdTex[opt.columnName].Inactive.Body),
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": opt =>
        holdCap(holdTex[opt.columnName].Active.BottomCap),
      "Hold Inactive BottomCap": opt =>
        holdCap(holdTex[opt.columnName].Inactive.BottomCap),

      "Roll Active Head": { element: "Tap" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => holdBody(rollTex.Active.body),
      "Roll Inactive Body": () => holdBody(rollTex.Inactive.body),
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": () => holdCap(rollTex.Active.bottomCap),
      "Roll Inactive BottomCap": () => holdCap(rollTex.Inactive.bottomCap),
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
