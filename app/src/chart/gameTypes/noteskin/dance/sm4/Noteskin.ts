// SM4 Default, bundled with SM4

import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"

import { ModelRenderer } from "./ModelRenderer"
import { NoteFlashContainer } from "./NoteFlash"
import receptorUrl from "./receptor.png"

import holdBodyActiveUrl from "./hold/bodyActive.png"
import holdBodyInactiveUrl from "./hold/bodyInactive.png"
import holdBottomCapActiveUrl from "./hold/bottomCapActive.png"
import holdBottomCapInactiveUrl from "./hold/bottomCapInactive.png"

import { BezierAnimator } from "../../../../../util/BezierEasing"
import { rgbtoHex } from "../../../../../util/Color"
import { clamp } from "../../../../../util/Math"
import { HoldBody } from "../../_template/HoldBody"
import { HoldTail } from "../../_template/HoldTail"
import rollBodyActiveUrl from "./roll/bodyActive.png"
import rollBodyInactiveUrl from "./roll/bodyInactive.png"
import rollBottomCapActiveUrl from "./roll/bottomCapActive.png"
import rollBottomCapInactiveUrl from "./roll/bottomCapInactive.png"

const receptorTex = Texture.from(receptorUrl)

const holdTex = {
  hold: {
    active: {
      body: Texture.from(holdBodyActiveUrl),
      bottomCap: Texture.from(holdBottomCapActiveUrl),
    },
    inactive: {
      body: Texture.from(holdBodyInactiveUrl),
      bottomCap: Texture.from(holdBottomCapInactiveUrl),
    },
  },
  roll: {
    active: {
      body: Texture.from(rollBodyActiveUrl),
      bottomCap: Texture.from(rollBottomCapActiveUrl),
    },
    inactive: {
      body: Texture.from(rollBodyInactiveUrl),
      bottomCap: Texture.from(rollBottomCapInactiveUrl),
    },
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

export default {
  elements: {
    Left: {
      Receptor: options => {
        let zoomanim: string | undefined
        const container = new Container()
        const spr = new Sprite(receptorTex)
        spr.width = 64
        spr.height = 64
        spr.anchor.set(0.5)
        const overlay = new Sprite(receptorTex)
        overlay.width = 64
        overlay.height = 64
        overlay.alpha = 0
        overlay.blendMode = BLEND_MODES.ADD
        overlay.anchor.set(0.5)
        container.addChild(spr, overlay)
        options.noteskin.on(
          container,
          "press",
          opt =>
            opt.columnNumber == options.columnNumber && (overlay.alpha = 0.2)
        )
        options.noteskin.on(
          container,
          "lift",
          opt => opt.columnNumber == options.columnNumber && (overlay.alpha = 0)
        )
        options.noteskin.on(container, "ghosttap", opt => {
          if (opt.columnNumber == options.columnNumber) {
            BezierAnimator.finish(zoomanim)
            zoomanim = BezierAnimator.animate(
              container,
              {
                "0": {
                  "scale.x": 0.75,
                  "scale.y": 0.75,
                },
                "1": {
                  "scale.x": 1,
                  "scale.y": 1,
                },
              },
              0.11
            )
          }
        })
        options.noteskin.onUpdate(container, r => {
          const partialBeat = ((r.getVisualBeat() % 1) + 1) % 1
          const col = clamp(1 - partialBeat, 0.5, 1) * 255
          spr.tint = rgbtoHex(col, col, col)
        })
        return container
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
      "Hold Active Body": () => new HoldBody(holdTex.hold.active.body),
      "Hold Inactive Body": () => new HoldBody(holdTex.hold.inactive.body),
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": () =>
        new HoldTail(holdTex.hold.active.bottomCap),
      "Hold Inactive BottomCap": () =>
        new HoldTail(holdTex.hold.inactive.bottomCap),

      "Roll Active Head": { element: "Tap" },
      "Roll Inactive Head": { element: "Tap" },
      "Roll Active Body": () => new HoldBody(holdTex.roll.active.body),
      "Roll Inactive Body": () => new HoldBody(holdTex.roll.inactive.body),
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": () =>
        new HoldTail(holdTex.roll.active.bottomCap),
      "Roll Inactive BottomCap": () =>
        new HoldTail(holdTex.roll.inactive.bottomCap),
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
