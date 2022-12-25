import { Container, Sprite, Texture } from "pixi.js"
import { getRotFromArrow } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { Judgment } from "../play/Judgment"

export const FLASH_TEX: Map<Judgment, Texture> = new Map([
  [Judgment.FANTASTIC, Texture.from('assets/noteskin/flash/fantastic.png')],
  [Judgment.WHITE_FANTASTIC, Texture.from('assets/noteskin/flash/white_fantastic.png')],
  [Judgment.EXCELLENT, Texture.from('assets/noteskin/flash/excellent.png')],
  [Judgment.GREAT, Texture.from('assets/noteskin/flash/great.png')],
  [Judgment.DECENT, Texture.from('assets/noteskin/flash/decent.png')],
  [Judgment.WAY_OFF, Texture.from('assets/noteskin/flash/way_off.png')]
])

interface NoteFlashObject extends Sprite {
  createTime: number,
}

export class NoteFlashContainer extends Container {

  private renderer: ChartRenderer

  children: NoteFlashObject[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  renderThis() {
    this.y = this.renderer.options.chart.receptorYPos

    for (let child of this.children) { 
      let t = (Date.now() - child.createTime)/150
      child.scale.set(1.1-t*0.1)
      child.alpha = (1.2-t*1.2)
    }

    this.children.filter(child => Date.now() - child.createTime > 150).forEach(child => this.removeChild(child))  
  }

  addFlash(col: number, judgment: Judgment) {
    if (!this.renderer.options.chart.drawNoteFlash) return
    let flash = new Sprite(FLASH_TEX.get(judgment)) as NoteFlashObject
    flash.width = 106
    flash.height = 106
    flash.anchor.set(0.5)
    flash.rotation = getRotFromArrow(col)
    flash.x = col*64-96
    flash.createTime = Date.now()
    this.addChild(flash)
  }
}