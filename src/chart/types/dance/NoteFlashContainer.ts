import { BLEND_MODES, Container, Sprite, Texture } from "pixi.js"
import { Options } from "../../../util/Options"
import { TimingWindow } from "../../play/TimingWindow"
import { isHoldDroppedTimingWindow, isHoldTimingWindow, isMineTimingWindow, isStandardTimingWindow } from "../../play/TimingWindowCollection"
import { DanceNotefield } from "./DanceNotefield"

const HOLD_TEX = Texture.from('assets/noteskin/dance/flash/hold.png')

const FLASH_TEX_MAP: Record<string, Texture> = {
  "w0": Texture.from('assets/noteskin/dance/flash/fantastic.png'),
  "w1": Texture.from('assets/noteskin/dance/flash/white_fantastic.png'),
  "w2": Texture.from('assets/noteskin/dance/flash/excellent.png'),
  "w3": Texture.from('assets/noteskin/dance/flash/great.png'),
  "w4": Texture.from('assets/noteskin/dance/flash/decent.png'),
  "w5": Texture.from('assets/noteskin/dance/flash/way_off.png'),
  "mine": Texture.from('assets/noteskin/dance/flash/mine.png'),
}

interface NoteFlashObject extends Sprite {
  createTime: number,
  type: string,
  col: number
}

export class NoteFlashContainer extends Container {

  private notefield: DanceNotefield
  children: NoteFlashObject[] = []

  constructor(notefield: DanceNotefield) {
    super()
    this.notefield = notefield
  }

  renderThis() {
    this.y = Options.chart.receptorYPos

    for (let child of this.children) { 
      switch(child.type) {
        case "flash":
          let t = (Date.now() - child.createTime)/150
          child.scale.set(1.1-t*0.1)
          child.alpha = (1.2-t*1.2)
          break
        case "mine":
          let t2 = (Date.now() - child.createTime)/600
          child.rotation = t2 * -Math.PI
          child.alpha = Math.min(1, 2-(2*t2))
          break
        case "hold":
          child.alpha = Math.sin(Date.now())*0.2+1.2
      }
    }

    this.children.filter(child => Date.now() - child.createTime > 150 && child.type == "flash").forEach(child => {
      child.destroy()
      this.removeChild(child)
    })  
    this.children.filter(child => Date.now() - child.createTime > 600 && child.type == "hold").forEach(child => {
      child.destroy()
      this.removeChild(child)
    })  
  }

  addFlash(col: number, judgment: TimingWindow) {
    if (!Options.chart.drawNoteFlash) return
    let tex: Texture | undefined = undefined
    if (isStandardTimingWindow(judgment)) tex = FLASH_TEX_MAP[judgment.id]
    if (isMineTimingWindow(judgment)) tex = FLASH_TEX_MAP["mine"]
    if (isHoldTimingWindow(judgment)) tex = FLASH_TEX_MAP["w2"]
    if (isHoldTimingWindow(judgment) || isHoldDroppedTimingWindow(judgment)) {
      this.children.filter(child => child.type == "hold" && child.col == col).forEach(child => {
        child.destroy()
        this.removeChild(child)
      }) 
    }
    if (!tex) return
    let flash = new Sprite(tex) as NoteFlashObject
    flash.anchor.set(0.5)
    flash.rotation = this.notefield.getRotFromCol(col)
    flash.x = this.notefield.getColX(col)
    flash.createTime = Date.now()
    flash.type = "flash"
    flash.col = col
    if (isMineTimingWindow(judgment)) {
      flash.type = "mine"
      flash.blendMode = BLEND_MODES.ADD
    }
    this.addChild(flash)
  }

  activateHold(col: number) {
    if (!Options.chart.drawNoteFlash) return
    let flash = new Sprite(HOLD_TEX) as NoteFlashObject
    flash.anchor.set(0.5)
    flash.rotation = this.notefield.getRotFromCol(col)
    flash.x = this.notefield.getColX(col)
    flash.type = "hold"
    flash.col = col
    this.addChild(flash)
  }

  reset() {
    this.children.filter(child => child.type == "hold").forEach(child => {
      child.destroy()
      this.removeChild(child)
    }) 
  }
}