import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { getRotFromArrow } from "../../util/Util"
import { TimingWindow } from "../play/TimingWindow"

const HOLD_TEX = Texture.from('assets/noteskin/flash/hold.png')

interface NoteFlashObject extends Sprite {
  createTime: number,
  mine: boolean
}

export class NoteFlashContainer extends Container {

  children: NoteFlashObject[] = []

  renderThis() {
    this.y = Options.chart.receptorYPos

    for (let child of this.children) { 
      if (child.mine){
        let t = (Date.now() - child.createTime)/600
        child.rotation = t * -Math.PI
        child.alpha = Math.min(1, 2-(2*t))
      }else{
        let t = (Date.now() - child.createTime)/150
        child.scale.set(1.1-t*0.1)
        child.alpha = (1.2-t*1.2)
      }
    }

    this.children.filter(child => Date.now() - child.createTime > 150 && !child.mine).forEach(child => this.removeChild(child))  
    this.children.filter(child => Date.now() - child.createTime > 600 && child.mine).forEach(child => this.removeChild(child))  
  }

  addFlash(col: number, judgment: TimingWindow) {
    if (!Options.chart.drawNoteFlash || !judgment.noteFlashTexture) return
    let flash = new Sprite(judgment.noteFlashTexture) as NoteFlashObject
    flash.width = 106
    flash.height = 106
    flash.anchor.set(0.5)
    flash.rotation = getRotFromArrow(col)
    flash.x = col*64-96
    flash.createTime = Date.now()
    flash.mine = judgment.name == "Mine"
    if (flash.mine) flash.blendMode = BLEND_MODES.ADD
    this.addChild(flash)
  }

  addHoldFlash(col: number) {
    if (!Options.chart.drawNoteFlash) return
    let flash = new Sprite(HOLD_TEX) as NoteFlashObject
    flash.width = 106
    flash.height = 106
    flash.anchor.set(0.5)
    flash.rotation = getRotFromArrow(col)
    flash.x = col*64-96
    flash.createTime = Date.now()
    flash.mine = false
    this.addChild(flash)
  }
}