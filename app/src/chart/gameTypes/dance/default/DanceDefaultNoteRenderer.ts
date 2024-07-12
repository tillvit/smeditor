import { Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { rgbtoHex } from "../../../../util/Color"
import { NotedataEntry } from "../../../sm/NoteTypes"
import { DanceDefaultNoteTexture } from "./DanceDefaultNoteTexture"

import holdBodyUrl from "../../../../../assets/noteskin/dance/default/hold/body.png"
import holdCapUrl from "../../../../../assets/noteskin/dance/default/hold/cap.png"
import fakeIconUrl from "../../../../../assets/noteskin/dance/default/icon/fake.png"
import rollBodyUrl from "../../../../../assets/noteskin/dance/default/roll/body.png"
import rollCapUrl from "../../../../../assets/noteskin/dance/default/roll/cap.png"
import { EditMode } from "../../../ChartManager"
import { ChartRenderer } from "../../../ChartRenderer"
import { NoteObject, NoteObjectHold } from "../../base/Noteskin"
import { rotationMap } from "./DanceDefaultNoteskin"

const holdBodyTex = Texture.from(holdBodyUrl)
const holdCapTex = Texture.from(holdCapUrl)

const rollBodyTex = Texture.from(rollBodyUrl)
const rollCapTex = Texture.from(rollCapUrl)

const ICONS: Record<string, Texture> = {
  Fake: Texture.from(fakeIconUrl),
}

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
    const holdBody = new TilingSprite(holdBodyTex, 64, 0)
    holdBody.tileScale.x = 0.5
    holdBody.tileScale.y = 0.5
    holdBody.uvRespectAnchor = true
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

  setActive(_active: boolean) {}
}

export class DanceDefaultNoteObject extends Container implements NoteObject {
  type = ""
  hold?: DanceDefaultNoteHold
  note = new NoteItem()
  constructor(note: NotedataEntry, columnName: string) {
    super()
    this.eventMode = "static"
    const type = note.type

    DanceDefaultNoteTexture.setNoteTex(this.note.note, note)

    // Create hold
    if (type == "Hold" || type == "Roll") {
      this.hold = new DanceDefaultNoteHold(
        type == "Hold" ? holdBodyTex : rollBodyTex,
        type == "Hold" ? holdCapTex : rollCapTex
      )
      this.hold.holdBody.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.hold.holdCap.tint = rgbtoHex(0.8 * 255, 0.8 * 255, 0.8 * 255)
      this.addChild(this.hold)
    }

    // Create icon
    if (ICONS[type]) {
      const icon = new Sprite(ICONS[type])
      icon.width = 32
      icon.height = 32
      icon.anchor.set(0.5)
      icon.alpha = 0.9
      this.note.icon = icon
      this.note.addChild(icon)
    }

    this.addChild(this.note)
    this.type = note.type

    this.note.rotation = rotationMap[columnName]
  }

  update(renderer: ChartRenderer) {
    if (this.type == "Fake") {
      this.note.icon!.visible = renderer.chartManager.getMode() != EditMode.Play
    }
  }
}
