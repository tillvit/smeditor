import { Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { rgbtoHex } from "../../../../util/Color"
import { NotedataEntry } from "../../../sm/NoteTypes"

import { ChartRenderer } from "../../../ChartRenderer"
import { NoteObject, NoteObjectHold } from "../../base/Noteskin"

import { rotationMap } from "./PumpDefaultNoteskin"
import { PumpDefaultNoteTexture } from "./PumpDefaultNoteTexture"

import hBodyActiveUrl from "../../../../../assets/noteskin/pump/default/holdBodyActive.png"
import hCapActiveUrl from "../../../../../assets/noteskin/pump/default/holdCapActive.png"
import rBodyActiveUrl from "../../../../../assets/noteskin/pump/default/rollBodyActive.png"
import rCapActiveUrl from "../../../../../assets/noteskin/pump/default/rollCapActive.png"

import hBodyInactiveUrl from "../../../../../assets/noteskin/pump/default/holdBodyInactive.png"
import hCapInactiveUrl from "../../../../../assets/noteskin/pump/default/holdCapInactive.png"
import rBodyInactiveUrl from "../../../../../assets/noteskin/pump/default/rollBodyInactive.png"
import rCapInactiveUrl from "../../../../../assets/noteskin/pump/default/rollCapInactive.png"

const HOLD_TEXTURES = {
  Hold: {
    active: {
      body: Texture.from(hBodyActiveUrl),
      cap: Texture.from(hCapActiveUrl),
    },
    inactive: {
      body: Texture.from(hBodyInactiveUrl),
      cap: Texture.from(hCapInactiveUrl),
    },
  },
  Roll: {
    active: {
      body: Texture.from(rBodyActiveUrl),
      cap: Texture.from(rCapActiveUrl),
    },
    inactive: {
      body: Texture.from(rBodyInactiveUrl),
      cap: Texture.from(rCapInactiveUrl),
    },
  },
}

class PumpDefaultNoteHold extends Container implements NoteObjectHold {
  holdBody: TilingSprite
  holdCap: Sprite
  holdTopCap: Sprite
  type

  constructor(type: "Hold" | "Roll") {
    super()
    this.type = type
    const holdBody = new TilingSprite(HOLD_TEXTURES[type].inactive.body, 64, 0)
    holdBody.tileScale.x = 0.5
    holdBody.tileScale.y = 0.5
    holdBody.uvRespectAnchor = true
    holdBody.anchor.y = 1

    holdBody.x = -32
    const holdCap = new Sprite(HOLD_TEXTURES[type].inactive.cap)
    holdCap.width = 64
    holdCap.height = 32
    holdCap.anchor.x = 0.5

    const holdTopCap = new Sprite(HOLD_TEXTURES[type].inactive.cap)
    holdTopCap.width = 64
    holdTopCap.height = -32
    holdTopCap.anchor.x = 0.5

    this.holdBody = holdBody
    this.holdCap = holdCap
    this.holdTopCap = holdTopCap
    this.addChild(holdBody)
    this.addChild(holdCap)
    this.addChild(holdTopCap)
  }

  setActive(active: boolean) {
    this.holdBody.texture =
      HOLD_TEXTURES[this.type][active ? "active" : "inactive"].body
    this.holdCap.texture =
      HOLD_TEXTURES[this.type][active ? "active" : "inactive"].cap
    this.holdTopCap.texture =
      HOLD_TEXTURES[this.type][active ? "active" : "inactive"].cap
  }
}

export class PumpDefaultNoteObject extends Container implements NoteObject {
  type = ""
  hold?: PumpDefaultNoteHold
  note: Sprite

  static getNoteRotation(colName: string) {
    return (rotationMap[colName] * Math.PI) / 180
  }

  constructor(note: NotedataEntry, columnName: string) {
    super()
    this.eventMode = "static"

    this.note = new Sprite()
    PumpDefaultNoteTexture.setNoteTex(this.note, note, columnName)
    this.note.width = 72
    this.note.height = 72
    this.note.rotation = PumpDefaultNoteObject.getNoteRotation(columnName)
    this.note.pivot.set(64)

    // Create hold
    const type = note.type
    if (type == "Hold" || type == "Roll") {
      this.hold = new PumpDefaultNoteHold(type)
      this.hold.holdBody.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.hold.holdCap.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.addChild(this.hold)
    }

    this.addChild(this.note)

    this.type = note.type
  }

  update(_renderer: ChartRenderer) {}
}
