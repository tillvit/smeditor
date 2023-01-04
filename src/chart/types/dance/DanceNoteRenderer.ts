import { Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { rgbtoHex } from "../../../util/Util";
import { PartialNotedataEntry } from "../../sm/NoteTypes"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteTexture } from "./DanceNoteTexture"


const hold_body_texture = Texture.from('assets/noteskin/dance/hold/body.png');
const hold_cap_texture = Texture.from('assets/noteskin/dance/hold/cap.png');

const roll_body_texture = Texture.from('assets/noteskin/dance/roll/body.png');
const roll_cap_texture = Texture.from('assets/noteskin/dance/roll/cap.png');

const ICONS: Record<string, Texture> = {
  Fake: Texture.from('assets/noteskin/dance/icon/fake.png'),
  Lift: Texture.from('assets/noteskin/dance/icon/lift.png')
}

export class NoteItem extends Container {
  note: Sprite
  icon?: Sprite
  constructor() {
    super()
    this.note = new Sprite()
    this.note.anchor.set(0.5)
    this.addChild(this.note)
  }
}

export class NoteHold extends Container {
  holdBody?: TilingSprite
  holdCap?: Sprite
}

export class NoteObject extends Container {
  type: string = ""
  hold: NoteHold 
  item: NoteItem
  constructor() {
    super()
    this.hold = new NoteHold()
    this.item = new NoteItem()
    this.addChild(this.hold)
    this.addChild(this.item)
  }
}


export class DanceNoteRenderer {

  static createArrow(): NoteObject {
    let arrow = new NoteObject();
    arrow.interactive = true
    return arrow
  }

  static setHoldLength(arrow: NoteObject, length: number) {
    if (arrow.type != "Roll" && arrow.type != "Hold") return
    arrow.hold.holdBody!.height = length
    arrow.hold.holdBody!.y = length
    arrow.hold.holdCap!.y = length
  }

  static setHoldBrightness(arrow: NoteObject, brightness: number) {
    if (arrow.type != "Roll" && arrow.type != "Hold") return
    arrow.hold.holdBody!.tint = rgbtoHex(brightness * 255, brightness * 255, brightness * 255)
    arrow.hold.holdCap!.tint = rgbtoHex(brightness * 255, brightness * 255, brightness * 255)
  }
  
  static hideFakeIcon(arrow: NoteObject, hide: boolean) {
    if (arrow.type != "Fake") return
    arrow.item.icon!.visible = !hide
  }

  static setData(notefield: DanceNotefield, arrow: NoteObject, note: PartialNotedataEntry) {
    let col = note.col
    let type = note.type

    // Reuse the old item
    DanceNoteTexture.setNoteTex(arrow.item.note, note)
    if (type == "Mine") arrow.item.note.rotation = 0
    else arrow.item.note.rotation = notefield.getRotFromCol(col)
  
    //Create hold 
    if (type == "Hold" || type == "Roll") {
      // Create new item if not reusing
      if (!arrow.hold.holdBody || !arrow.hold.holdCap) { 
        let holdBody = new TilingSprite(type == "Hold" ? hold_body_texture : roll_body_texture, 64, 0)
        holdBody.tileScale.x = 0.5
        holdBody.tileScale.y = 0.5
        holdBody.uvRespectAnchor = true
        holdBody.anchor.y = 1
        
        holdBody.x = -32
        let holdCap = new Sprite(type == "Hold" ? hold_cap_texture : roll_cap_texture)
        holdCap.width = 64
        holdCap.height = 32
        holdCap.anchor.x = 0.5

        arrow.hold.holdBody = holdBody
        arrow.hold.holdCap = holdCap
        arrow.hold.addChild(holdBody)
        arrow.hold.addChild(holdCap)
      }
      DanceNoteRenderer.setHoldBrightness(arrow, 0.8)
      arrow.hold.visible = true
    }else{
      arrow.hold.visible = false
    }
    
    //Create Icon
    if (ICONS[type]) {
       // Remove old item if it is not the same icon
       if (arrow.item.icon && arrow.type != note.type) {
        arrow.item.icon.destroy()
        arrow.item.removeChild(arrow.item.icon)
        arrow.item.icon = undefined
      }
      // Create new item if not reusing
      if (!arrow.item.icon) {
        let icon = new Sprite(ICONS[type])
        icon.width = 32
        icon.height = 32
        icon.anchor.set(0.5)
        icon.alpha = 0.5
        arrow.item.icon = icon
        arrow.item.addChild(icon);
      }
      arrow.item.icon.rotation = -notefield.getRotFromCol(col)
      arrow.item.icon.visible = true
    }else{
      if (arrow.item.icon) arrow.item.icon.visible = false
    }

    //Set arrow type
    arrow.type = note.type
  }
}
