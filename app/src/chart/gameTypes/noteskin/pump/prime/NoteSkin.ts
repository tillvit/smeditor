// PRIME, from https://github.com/cesarmades/piunoteskins

import {
  AnimatedSprite,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import { Noteskin, NoteskinOptions } from "../../Noteskin"
import { NoteRenderer } from "./NoteRenderer"

import receptorsUrl from "./receptors.png"

import { splitTex } from "../../../../../util/Util"
import { NoteFlashContainer } from "./NoteFlash"

const receptorTex = splitTex(Texture.from(receptorsUrl), 5, 2, 96, 96)

export const texOrder = ["DownLeft", "UpLeft", "Center", "UpRight", "DownRight"]

const holdTex: Record<string, { body: Texture[]; cap: Texture[] }> = {}

for (const col of texOrder) {
  const body = splitTex(
    Texture.from(new URL(`./hold/${col}Body.png`, import.meta.url).href),
    6,
    1,
    96,
    128
  )[0]
  const cap = splitTex(
    Texture.from(new URL(`./hold/${col}Cap.png`, import.meta.url).href),
    6,
    1,
    96,
    120
  )[0]
  holdTex[col] = { body, cap }
}

class HoldWithTail extends Container {
  body
  cap
  constructor(columnName: string, noteskin: Noteskin) {
    super()
    const body = new AnimatedSprite(holdTex[columnName].body)
    body.width = 72
    body.anchor.y = 1
    body.x = -36

    const cap = new AnimatedSprite(holdTex[columnName].cap)
    cap.scale.set(72 / 96)
    cap.anchor.y = 0.5
    cap.x = -36

    this.body = body
    this.cap = cap
    this.addChild(body, cap)

    noteskin.onUpdate(this, cr => {
      const time = cr.getVisualTime()

      const frame = Math.floor(((((time % 0.3) + 0.3) % 0.3) / 0.3) * 6)

      cap.currentFrame = frame
      body.currentFrame = frame
    })
  }

  set height(height: number) {
    this.body.height = Math.abs(height)
    this.body.anchor.y = height >= 0 ? 1 : 0

    this.cap.scale.y = ((height >= 0 ? 1 : -1) * 72) / 96

    return
  }
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
      "Hold Active Body": opt => new HoldWithTail(opt.columnName, opt.noteskin),
      "Hold Inactive Body": { element: "Hold Active Body" },
      "Hold Active TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive TopCap": () => new Sprite(Texture.EMPTY),
      "Hold Active BottomCap": () => new Sprite(Texture.EMPTY),
      "Hold Inactive BottomCap": () => new Sprite(Texture.EMPTY),

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
      "Roll Active BottomCap": () => new Sprite(Texture.EMPTY),
      "Roll Inactive BottomCap": () => new Sprite(Texture.EMPTY),
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
} satisfies NoteskinOptions
