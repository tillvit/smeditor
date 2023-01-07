import { BitmapText, Container, Graphics } from "pixi.js"
import { Options } from "../../util/Options"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"

const snapNumbers = {
  fontName: "Assistant",
  fontSize: 10,
  fill: ["#ffffff"],
}

const SNAP_COLORS: { [key: number]: number } = {
  4: 0xe74827,
  8: 0x3d89f7,
  12: 0xaa2df4,
  16: 0x82e247,
  24: 0xaa2df4,
  32: 0xeaa138,
  48: 0xaa2df4,
  64: 0x6be88e,
  96: 0x6be88e,
  192: 0x6be88e,
}

export class SnapContainer extends Container {
  private renderer: ChartRenderer

  children: Container[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    for (let i = 0; i < 2; i++) {
      const container = new Container()
      const graphic = new Graphics()
      const text = new BitmapText("4", snapNumbers)
      container.x =
        (i - 0.5) * (this.renderer.chart.gameType.notefieldWidth + 48)

      graphic.rotation = Math.PI / 4
      graphic.lineStyle(1, 0x000000, 1)
      graphic.beginFill(0xffffff)
      graphic.drawRect(-12, -12, 24, 24)
      graphic.endFill()

      text.anchor.set(0.5)

      container.addChild(graphic)
      container.addChild(text)
      this.addChild(container)
    }
  }

  renderThis() {
    this.y = Options.chart.receptorYPos

    this.visible = this.renderer.chartManager.getMode() == EditMode.Edit
    for (let i = 0; i < 2; i++) {
      const container = this.children[i]
      const square = container.children[0] as Graphics
      square.tint = SNAP_COLORS[4 / Options.chart.snap] ?? 0x707070
      const text = container.children[1] as BitmapText
      text.text =
        "" +
        (Options.chart.snap == 0 || (4 / Options.chart.snap) % 1 != 0
          ? ""
          : 4 / Options.chart.snap)
    }
  }
}
