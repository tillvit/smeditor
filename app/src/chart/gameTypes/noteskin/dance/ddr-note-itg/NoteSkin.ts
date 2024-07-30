// Peters-DDR-Note by Pete-Lawrence https://github.com/Pete-Lawrence/Peters-Noteskins/
// Color modifications by tillvit

import { AnimatedSprite, Sprite, Texture } from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"

import { ModelRenderer } from "./ModelRenderer"
import { NoteFlashContainer } from "./NoteFlash"
import receptorUrl from "./receptor.png"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { splitTex } from "../../../../../util/Util"
import { HoldBody } from "../../_template/HoldBody"
import { HoldTail } from "../../_template/HoldTail"

const receptorTex = Texture.from(receptorUrl)

const holdTex: Record<string, Record<string, Record<string, Texture>>> = {}
const rollTex: Record<string, Record<string, Texture>> = {}

for (const dir of ["Left", "Down", "Up", "Right", "UpLeft", "UpRight"]) {
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

export default {
  elements: {
    Left: {
      Receptor: options => {
        let zoomanim: string | undefined
        const spr = new AnimatedSprite(splitTex(receptorTex, 2, 1, 256, 256)[0])
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

      "Roll Active Head": { element: "Tap" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => new HoldBody(rollTex.Active.body),
      "Roll Inactive Body": () => new HoldBody(rollTex.Inactive.body),
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": () => new HoldTail(rollTex.Active.bottomCap),
      "Roll Inactive BottomCap": () => new HoldTail(rollTex.Inactive.bottomCap),
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
  hideIcons: ["Lift"],
  metrics: {
    HoldBodyBottomOffset: -32,
    RollBodyBottomOffset: -32,
  },
} satisfies NoteskinOptions
