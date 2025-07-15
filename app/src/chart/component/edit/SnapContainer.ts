import { BitmapText, Container, Graphics } from "pixi.js"
import { SnapPopup } from "../../../gui/popup/SnapPopup"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"

const snapNumbers = {
  fontName: "Main",
  fontSize: 10,
  fill: ["#ffffff"],
}

export const QUANT_COLORS: { [key: number]: number } = {
  4: 0xe74827,
  8: 0x3d89f7,
  12: 0xaa2df4,
  16: 0x82e247,
  24: 0xd82eab,
  32: 0xeaa138,
  48: 0xef8ceb,
  64: 0x6be88e,
  96: 0x828282,
  192: 0x828282,
}

export class SnapContainer extends Container implements ChartRendererComponent {
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

      container.addChild(graphic, text)
      this.addChild(container)

      container.eventMode = "static"
      container.on("mouseenter", () => SnapPopup.open(graphic))
      container.on("mousedown", () => SnapPopup.select())
      container.on("mouseleave", () => {
        if (!SnapPopup.persistent) SnapPopup.close()
      })
    }
  }

  update() {
    this.y = this.renderer.getActualReceptorYPos()

    this.visible = this.renderer.shouldDisplayEditGUI()
    for (let i = 0; i < 2; i++) {
      const container = this.children[i]
      const square = container.children[0] as Graphics
      square.tint = QUANT_COLORS[4 / Options.chart.snap] ?? 0x707070
      const text = container.children[1] as BitmapText
      text.text =
        "" +
        (Options.chart.snap == 0 || (4 / Options.chart.snap) % 1 != 0
          ? ""
          : 4 / Options.chart.snap)
    }
  }
}
