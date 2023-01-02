import { Container, Sprite, Texture } from "pixi.js"
import { ColHeldTracker } from "../../../util/ColHeldTracker"
import { rgbtoHex } from "../../../util/Util"
import { ChartRenderer } from "../../ChartRenderer"
import { DanceNotefield } from "./DanceNotefield"

const receptor_tex = Texture.from('assets/noteskin/dance/receptor.png');

interface Receptor extends Sprite {
  lastPressedTime: number,
  pressed: boolean
}

export class ReceptorContainer extends Container {

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private receptors: Container = new Container()
  private pressedCols: ColHeldTracker = new ColHeldTracker()

  children: Sprite[] = []

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.notefield = notefield
    this.renderer = renderer
    for (let i = 0; i < this.notefield.getNumCols(); i ++) {
      let receptor = new Sprite(receptor_tex) as Receptor
      receptor.width = 69
      receptor.height = 69
      receptor.anchor.set(0.5)
      receptor.x = this.notefield.getColX(i)
      receptor.rotation = this.notefield.getRotFromCol(i)
      receptor.lastPressedTime = -1
      receptor.pressed = false
      this.receptors.addChild(receptor)
    }

    this.addChild(this.receptors)
  }

  renderThis(beat: number) {
    this.y = this.renderer.getYPos(this.renderer.getBeat())

    for (let child of this.receptors.children) { 
      let receptor = child as Receptor
      let col = Math.min(1, Math.max((1 - ((beat+100000) % 1)), 0.5 + (receptor.pressed ? 0.1 : 0) )) * 255
      let scale = 1
      if (Date.now() - receptor.lastPressedTime < 110) scale = (Date.now() - receptor.lastPressedTime)/110*0.25+0.75
      receptor.scale.set(scale*0.5)
      receptor.tint = rgbtoHex(col, col, col)
    }
  }

  keyDown(col: number) {
    let wasPressed = this.pressedCols.isPressed(col)
    this.pressedCols.keyDown(col)
    let receptor = this.receptors.children[col] as Receptor
    receptor.pressed = true
    if (!wasPressed) receptor.lastPressedTime = Date.now()
  }

  keyUp(col: number) {
    this.pressedCols.keyUp(col)
    let receptor = this.receptors.children[col] as Receptor
    receptor.pressed = this.pressedCols.isPressed(col)
  }
}