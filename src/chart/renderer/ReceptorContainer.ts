import { BitmapText, Container, Graphics, Sprite, Texture } from "pixi.js"
import { getRotFromArrow, rgbtoHex } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"

const receptor_tex = Texture.from('assets/noteskin/receptor.png');

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

export class ReceptorContainer extends Container {

  private renderer: ChartRenderer
  private receptors: Container = new Container()
  private snapDisplay: Container = new Container()

  children: Sprite[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    for (let i = 0; i < 4; i ++) {
      let receptor = new Sprite(receptor_tex)
      receptor.width = 69
      receptor.height = 69
      receptor.anchor.set(0.5)
      receptor.x = i*64-96
      receptor.rotation = getRotFromArrow(i)
      this.receptors.addChild(receptor)
    }

    for (let i = 0; i < 2; i ++) {
      let container = new Container()
      let graphic = new Graphics()
      let text = new BitmapText("4", snapNumbers)
      container.x = (i-0.5)*300
      
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
    this.y = this.renderer.options.chart.receptorYPos

    for (let child of this.receptors.children) { 
      let col = Math.max((1 - (beat % 1)), 0.5) * 255;
      (<Sprite>child).tint = rgbtoHex(col, col, col)
    }

    for (let i = 0; i < 2; i++) {
      let container = this.snapDisplay.children[i] as Container
      let square = container.children[0] as Graphics
      square.tint = SNAP_COLORS[4/this.renderer.options.chart.snap] ?? 0x707070
      let text = container.children[1] as BitmapText
      text.text = "" + ((this.renderer.options.chart.snap == 0 || 4/this.renderer.options.chart.snap%1 != 0) ? "" : (4/this.renderer.options.chart.snap))
    }
    
  }
}