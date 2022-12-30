import { BitmapText, Container, Graphics, Sprite, Texture } from "pixi.js"
import { ColHeldTracker } from "../../../util/ColHeldTracker"
import { Options } from "../../../util/Options"
import { rgbtoHex } from "../../../util/Util"
import { EditMode } from "../../ChartManager"
import { ChartRenderer } from "../../ChartRenderer"
import { DanceNotefield } from "./DanceNotefield"

const receptor_tex = Texture.from('assets/noteskin/dance/receptor.png');

const snapNumbers = {
  fontName: "Assistant",
  fontSize: 10,
  fill: ['#ffffff']
}

const SNAP_COLORS: {[key: number]: number} = {
  4: 0xE74827,
  8: 0x3D89F7,
  12:0xAA2DF4,
  16:0x82E247,
  24:0xAA2DF4,
  32:0xEAA138,
  48:0xAA2DF4,
  64:0x6BE88E,
  96:0x6BE88E,
  192:0x6BE88E
}

interface Receptor extends Sprite {
  lastPressedTime: number,
  pressed: boolean
}

export class ReceptorContainer extends Container {

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private receptors: Container = new Container()
  private snapDisplay: Container = new Container()
  private pressedCols: ColHeldTracker = new ColHeldTracker()

  children: Sprite[] = []

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.notefield = notefield
    this.renderer = renderer
    for (let i = 0; i < 4; i ++) {
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

    for (let i = 0; i < 2; i ++) {
      let container = new Container()
      let graphic = new Graphics()
      let text = new BitmapText("4", snapNumbers)
      container.x = (i-0.5)*(64*(this.notefield.getNumCols()+0.5)+16)
      
      graphic.rotation = Math.PI / 4
      graphic.lineStyle(1, 0x000000, 1);
      graphic.beginFill(0xffffff);
      graphic.drawRect(-12, -12, 24, 24);
      graphic.endFill();

      text.anchor.set(0.5)

      container.addChild(graphic)
      container.addChild(text)
      this.snapDisplay.addChild(container)
    }

    this.addChild(this.receptors)
    this.addChild(this.snapDisplay)
  }

  renderThis(beat: number) {
    this.y = Options.chart.receptorYPos

    for (let child of this.receptors.children) { 
      let receptor = child as Receptor
      let col = Math.min(1, Math.max((1 - ((beat+100000) % 1)), 0.5 + (receptor.pressed ? 0.1 : 0) )) * 255
      let scale = 1
      if (Date.now() - receptor.lastPressedTime < 110) scale = (Date.now() - receptor.lastPressedTime)/110*0.25+0.75
      receptor.scale.set(scale*0.5)
      receptor.tint = rgbtoHex(col, col, col)
    }

    this.snapDisplay.visible = this.renderer.chartManager.getMode() == EditMode.Edit
    for (let i = 0; i < 2; i++) {
      let container = this.snapDisplay.children[i] as Container
      let square = container.children[0] as Graphics
      square.tint = SNAP_COLORS[4/Options.chart.snap] ?? 0x707070
      let text = container.children[1] as BitmapText
      text.text = "" + ((Options.chart.snap == 0 || 4/Options.chart.snap%1 != 0) ? "" : (4/Options.chart.snap))
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