import { Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { getQuant, getRotFromArrow, rgbtoHex } from "../../util/Util";
import { PartialNotedataEntry } from "../sm/NoteTypes"
import { NoteTexture } from "./NoteTexture"

const mine_frame_texture = Texture.from('assets/noteskin/mine/frame.png');

const hold_body_texture = Texture.from('assets/noteskin/hold/body.png');
const hold_cap_texture = Texture.from('assets/noteskin/hold/cap.png');

const roll_body_texture = Texture.from('assets/noteskin/roll/body.png');
const roll_cap_texture = Texture.from('assets/noteskin/roll/cap.png');

const icons = {
  Fake: Texture.from('assets/noteskin/icon/fake.png'),
  Lift: Texture.from('assets/noteskin/icon/lift.png')
}


export class NoteRenderer {
  static createArrow(note: PartialNotedataEntry): Container {
    let arrow = new Container();
    let hold_container = new Container();
    let item_container = new Container();
    arrow.addChild(hold_container)
    arrow.addChild(item_container)
    this.setData(arrow, note);
    arrow.interactive = true
    return arrow
  }
  static setMineTime(arrow: Container, seconds: number) {
    let item = arrow.getChildAt(1)
    item.rotation = seconds % 1 * Math.PI * 2
  }

  static setHoldLength(arrow: Container, length: number) {
    let hold_container = arrow.getChildAt(0) as Container
    let hold_body = hold_container.getChildAt(0) as TilingSprite
    hold_body.height = length
    hold_body.y = length
    let hold_cap = hold_container.getChildAt(1) as Sprite
    hold_cap.y = length
  }

  static setHoldBrightness(arrow: Container, brightness: number) {
    let hold_container = arrow.getChildAt(0) as Container
    let hold_body = hold_container.getChildAt(0) as TilingSprite
    hold_body.tint = rgbtoHex(brightness * 255, brightness * 255, brightness * 255)
    let hold_cap = hold_container.getChildAt(1) as Sprite
    hold_cap.tint = rgbtoHex(brightness * 255, brightness * 255, brightness * 255)
  }
  
  static hideFakeOverlay(arrow: Container, hide: boolean) {
    let item = arrow.getChildAt(1) as Container
    let overlay = item.getChildAt(1) as Container
    overlay.visible = !hide
  }

  static setData(arrow: Container, note: PartialNotedataEntry) {
    let item_container = arrow.getChildAt(1) as Container
    for (let i = 0; i < item_container.children.length; i++)
      item_container.children[i].destroy()
    item_container.removeChildren()
    let hold_container = arrow.getChildAt(0) as Container
    for (let i = 0; i < hold_container.children.length; i++)
      hold_container.children[i].destroy()
      hold_container.removeChildren()
    let beat = note.beat
    let col = note.col
    let type = note.type
    
    if (type == "Tap" || type == "Fake" || type == "Hold" || type == "Roll" || type == "Lift") {
      let note = NoteTexture.getSpriteWithQuant(getQuant(beat))
      item_container.addChild(note);
      item_container.rotation = getRotFromArrow(col)
      if (type == "Fake" || type == "Lift") {
        let icon = new Sprite(icons[type])
        icon.width = 32
        icon.height = 32
        icon.anchor.set(0.5)
        icon.alpha = 0.5
        icon.rotation = -getRotFromArrow(col)
        item_container.addChild(icon);
      }
      if (type == "Hold" || type == "Roll") {
        let hold_body = new TilingSprite(
          type == "Hold" ? hold_body_texture : roll_body_texture,
          64,
          0,
        );
        hold_body.tileScale.x = 0.5
        hold_body.tileScale.y = 0.5
        hold_body.uvRespectAnchor = true
        hold_body.anchor.y = 1
        
        hold_body.x = -32
        let hold_cap = new Sprite(type == "Hold" ? hold_cap_texture : roll_cap_texture)
        hold_cap.width = 64
        hold_cap.height = 32
        hold_cap.anchor.x = 0.5
  
        hold_container.addChild(hold_body)
        hold_container.addChild(hold_cap)
        NoteRenderer.setHoldBrightness(arrow, 0.8)
      }
    }else if (type == "Mine") {
      let mine_frame = new Sprite(mine_frame_texture)
      let mine_body = NoteTexture.getMine()
      mine_frame.width = 64
      mine_frame.height = 64
      mine_frame.anchor.set(0.5)
  
      item_container.addChild(mine_body);
      item_container.addChild(mine_frame);
      
    }
  }
}
