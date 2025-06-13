// FIESTA, from https://github.com/cesarmades/piunoteskins

import { BLEND_MODES, Container, Rectangle, Sprite, Texture } from "pixi.js"
import { NoteskinOptions } from "../../Noteskin"
import { NoteRenderer } from "./NoteRenderer"

import receptorsUrl from "./receptors.png"

import { splitTex } from "../../../../../util/PixiUtil"
import { AnimatedHoldBody } from "../../_template/HoldBody"
import { AnimatedHoldTail } from "../../_template/HoldTail"
import { NoteFlashContainer } from "./NoteFlash"

const receptorTex = splitTex(Texture.from(receptorsUrl), 5, 2, 96, 96)

export const texOrder = ["DownLeft", "UpLeft", "Center", "UpRight", "DownRight"]

const holdTex: Record<string, { body: Texture[]; cap: Texture[] }> = {}

const tailHeight = 96

for (const col of texOrder) {
  // Split the hold into body and tail
  const tex = Texture.from(new URL(`./hold/${col}.png`, import.meta.url).href)
  const body: Texture[] = []
  const cap: Texture[] = []
  for (let i = 0; i < 6; i++) {
    body.push(
      new Texture(
        tex.baseTexture,
        new Rectangle(i * 96, 0, 96, 288 - tailHeight)
      )
    )
    cap.push(
      new Texture(
        tex.baseTexture,
        new Rectangle(i * 96, 288 - tailHeight, 96, tailHeight)
      )
    )
  }
  holdTex[col] = { body, cap }
}

export default {
  elements: {
    DownLeft: {
      Receptor: options => {
        const container = new Container()
        const tO = texOrder.indexOf(options.columnName)
        const spr = new Sprite(receptorTex[0][tO])
        spr.width = 72
        spr.height = 72
        spr.anchor.set(0.5)

        const highlight = new Sprite(receptorTex[1][tO])
        highlight.width = spr.width
        highlight.height = spr.height
        highlight.anchor.set(0.5)
        highlight.blendMode = BLEND_MODES.ADD

        container.addChild(spr, highlight)

        options.noteskin.onUpdate(container, r => {
          const beat = r.getVisualBeat()
          const partialBeat = ((beat % 1) + 1) % 1
          highlight.alpha = (1 - partialBeat) / 2
        })
        return container
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
        new NoteFlashContainer(
          options.noteskin,
          options.columnName,
          options.columnNumber
        ),
      "Hold Active Head": { element: "Tap" },
      "Hold Inactive Head": { element: "Tap" },
      "Hold Active Body": opt => {
        const body = new AnimatedHoldBody(holdTex[opt.columnName].body, 72)
        opt.noteskin.onUpdate(body, cr => {
          const time = cr.getVisualTime()

          const frame = Math.floor(((((time % 0.3) + 0.3) % 0.3) / 0.3) * 6)

          body.currentFrame = frame
        })
        return body
      },
      "Hold Inactive Body": { element: "Hold Active Body" },
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": opt => {
        const cap = new AnimatedHoldTail(holdTex[opt.columnName].cap, 72)
        opt.noteskin.onUpdate(cap, cr => {
          const time = cr.getVisualTime()

          const frame = Math.floor(((((time % 0.3) + 0.3) % 0.3) / 0.3) * 6)

          cap.currentFrame = frame
        })
        return cap
      },
      "Hold Inactive BottomCap": { element: "Hold Active BottomCap" },

      "Roll Active Head": options => {
        const spr = new Sprite(Texture.WHITE)
        NoteRenderer.setRollTex(spr, options.columnName)
        spr.anchor.set(0.5)
        spr.width = 72
        spr.height = 72
        return spr
      },
      "Roll Inactive Head": { element: "Roll Active Head" },
      "Roll Active Body": { element: "Hold Active Body" },
      "Roll Inactive Body": { element: "Hold Active Body" },
      "Roll Active TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Roll Active BottomCap": { element: "Hold Active BottomCap" },
      "Roll Inactive BottomCap": { element: "Hold Active BottomCap" },
    },
  },
  load: function (element, options) {
    element.columnName = "DownLeft"

    const sprite = this.loadElement(element, options)

    return sprite
  },
  init() {
    NoteRenderer.initArrowTex()
  },
  update(renderer) {
    NoteRenderer.setArrowTexTime(renderer.chartManager.app)
  },
  metrics: {
    HoldBodyBottomOffset: -36,
    RollBodyBottomOffset: -36,
  },
} satisfies NoteskinOptions
