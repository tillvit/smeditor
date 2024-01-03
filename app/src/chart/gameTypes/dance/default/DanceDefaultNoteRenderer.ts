import { Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { rgbtoHex } from "../../../../util/Color"
import { NotedataEntry } from "../../../sm/NoteTypes"

import { EditMode } from "../../../ChartManager"
import { ChartRenderer } from "../../../ChartRenderer"
import { NoteObject, NoteObjectHold } from "../../base/Noteskin"
import { DanceDefaultNoteTexture } from "./DanceDefaultNoteTexture"
import { DanceDefaultNoteskinObject } from "./DanceDefaultNoteskin"

class NoteItem extends Container {
  note: Sprite
  icon?: Sprite
  constructor() {
    super()
    this.note = new Sprite()
    this.note.anchor.set(0.5)
    this.addChild(this.note)
  }
}

class DanceDefaultNoteHold extends Container implements NoteObjectHold {
  holdBody: TilingSprite
  holdCap: Sprite
  constructor(holdBodyTex: Texture, holdCapTex: Texture) {
    super()
    const holdBody = new TilingSprite({
      texture: holdBodyTex,
      width: 64,
      height: 0,
    })
    holdBody.tileScale.x = 0.5
    holdBody.tileScale.y = 0.5
    // holdBody.uvRespectAnchor = true
    holdBody.anchor.y = 1

    holdBody.x = -32
    const holdCap = new Sprite(holdCapTex)
    holdCap.width = 64
    holdCap.height = 32
    holdCap.anchor.x = 0.5

    this.holdBody = holdBody
    this.holdCap = holdCap
    this.addChild(holdBody)
    this.addChild(holdCap)
  }
}

export class DanceDefaultNoteObject extends Container implements NoteObject {
  type = ""
  hold?: DanceDefaultNoteHold
  note = new NoteItem()
  constructor(noteskin: DanceDefaultNoteskinObject, note: NotedataEntry) {
    super()
    this.eventMode = "static"
    const type = note.type

    DanceDefaultNoteTexture.setNoteTex(this.note.note, note)

    // Create hold
    if (type == "Hold" || type == "Roll") {
      this.hold = new DanceDefaultNoteHold(
        type == "Hold"
          ? noteskin.textures["HoldBody"]
          : noteskin.textures["RollBody"],
        type == "Hold"
          ? noteskin.textures["HoldCap"]
          : noteskin.textures["RollCap"]
      )
      this.hold.holdBody.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.hold.holdCap.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.addChild(this.hold)
    }

    // Create icon
    if (type + "Icon" in noteskin.textures) {
      const icon = new Sprite(noteskin.textures[type + "Icon"])
      icon.width = 32
      icon.height = 32
      icon.anchor.set(0.5)
      icon.alpha = 0.9
      this.note.icon = icon
      this.note.addChild(icon)
    }

    this.addChild(this.note)
    this.type = note.type
  }
  update(renderer: ChartRenderer) {
    if (this.type == "Fake") {
      this.note.icon!.visible = renderer.chartManager.getMode() != EditMode.Play
    }
  }
}
