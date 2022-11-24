import { getQuant, getRotFromArrow } from "../util/Util.js";
import { getMine, getSpriteWithQuant } from "./NoteTexture.js";

const arrow_frame_texture = PIXI.Texture.from('assets/noteskin/tap/frame.png');
const mine_frame_texture = PIXI.Texture.from('assets/noteskin/mine/frame.png');

const hold_body_texture = PIXI.Texture.from('assets/noteskin/hold/body.png');
const hold_cap_texture = PIXI.Texture.from('assets/noteskin/hold/cap.png');

const roll_body_texture = PIXI.Texture.from('assets/noteskin/roll/body.png');
const roll_cap_texture = PIXI.Texture.from('assets/noteskin/roll/cap.png');

export function createArrow(note) {
  let arrow = new PIXI.Container();
  let item_container = new PIXI.Container();
  item_container.name = "item"
  let hold_container = new PIXI.Container();
  hold_container.name = "hold"
  arrow.addChild(hold_container)
  arrow.addChild(item_container)
  setData(arrow, note)
  return arrow
}

export function setMineTime(arrow, seconds) {
  let item = arrow.getChildByName("item")
  item.rotation = seconds % 1 * Math.PI * 2
}

export function setHoldEnd(arrow, yp) {
  let hold_container = arrow.getChildByName("hold")
  let hold_body = hold_container.getChildByName("body")
  hold_body.height = yp - arrow.y
  hold_body.y = yp - arrow.y
  let hold_cap = hold_container.getChildByName("cap")
  hold_cap.y = yp-arrow.y
}

export function setData(arrow, note) {
  let item_container = arrow.getChildByName("item")
  for (let i = 0; i < item_container.children.length; i++)
    item_container.children[i].destroy()
  item_container.removeChildren()
  let hold_container = arrow.getChildByName("hold")
  for (let i = 0; i < hold_container.children.length; i++)
    hold_container.children[i].destroy()
    hold_container.removeChildren()
  let beat = note.beat
  let col = note.col
  let type = note.type
  
  if (type == "Tap" || type == "Fake" || type == "Hold" || type == "Roll") {
    let arrow_frame = new PIXI.Sprite(arrow_frame_texture)
    let arrow_body = getSpriteWithQuant(getQuant(beat))
    arrow_frame.width = 64
    arrow_frame.height = 64
    arrow_frame.anchor.set(0.5)
    arrow_body.name = "body"
    arrow_frame.name = "frame"
    item_container.addChild(arrow_frame);
    item_container.addChild(arrow_body);
    item_container.rotation = getRotFromArrow(col)
    if (type == "Hold" || type == "Roll") {
      let hold_body = new PIXI.TilingSprite(
        type == "Hold" ? hold_body_texture : roll_body_texture,
        64,
        0,
      );
      hold_body.tileScale.x = 0.5
      hold_body.tileScale.y = 0.5
      hold_body.name = "body"
      hold_body.uvRespectAnchor = true
      hold_body.anchor.y = 1
      hold_container.addChild(hold_body);
      hold_body.x = -32
      let hold_cap = new PIXI.Sprite(type == "Hold" ? hold_cap_texture : roll_cap_texture)
      hold_cap.width = 64
      hold_cap.height = 32
      hold_cap.anchor.x = 0.5
      hold_cap.name = "cap"
      hold_container.addChild(hold_cap)
    }
  }else if (type == "Mine") {
    let mine_frame = new PIXI.Sprite(mine_frame_texture)
    let mine_body = getMine()
    mine_frame.width = 64
    mine_frame.height = 64
    mine_frame.anchor.set(0.5)
    mine_body.name = "body"
    mine_frame.name = "frame"
    
    item_container.addChild(mine_body);
    item_container.addChild(mine_frame);
    
  }
}


