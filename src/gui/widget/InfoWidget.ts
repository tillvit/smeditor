import { BitmapText, Container } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { roundDigit } from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const WIDGET_WIDTH = 300

export class InfoWidget extends Widget {
  background = new BetterRoundedRect()
  maskObj = new BetterRoundedRect()
  texts = new Container<BitmapText>()
  arrowBack = new BetterRoundedRect()

  private showEase = 0
  private easeVelocity = 0

  constructor(manager: WidgetManager) {
    super(manager)
    this.addChild(this.background)
    this.background.tint = 0
    this.background.alpha = 0.3
    this.background.width = WIDGET_WIDTH
    this.maskObj.width = WIDGET_WIDTH
    this.background.zIndex = -1
    this.visible = false
    this.sortableChildren = true
    this.addChild(this.maskObj, this.texts)
    const mode = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 25,
    })
    mode.name = "Mode"
    mode.x = 20
    mode.y = 20
    this.texts.addChild(mode)

    const info = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    info.name = "Info"
    info.x = 20
    info.y = 60
    info.anchor.y = 0
    this.texts.addChild(info)

    const chart = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    chart.name = "Chart"
    chart.x = 20
    chart.y = 50
    this.texts.addChild(chart)
    this.texts.mask = this.maskObj
  }

  update(): void {
    this.visible = true
    this.x = -this.manager.app.renderer.screen.width / 2 + 20
    this.y = -this.manager.app.renderer.screen.height / 2 + 20
    this.background.height = 150
    this.maskObj.height = 150

    const chart = this.manager.chartManager.chart

    if (chart) {
      this.texts.getChildByName<BitmapText>("Mode").text =
        this.manager.chartManager.getMode()
      this.texts.getChildByName<BitmapText>("Info").text =
        "\nTime: " +
        roundDigit(this.manager.chartManager.getTime(), 3) +
        "\nBeat: " +
        roundDigit(this.manager.chartManager.getBeat(), 3) +
        "\nBPM: " +
        roundDigit(
          chart.timingData.getBPM(this.manager.chartManager.getBeat()),
          3
        ) +
        "\n\nNote Type: " +
        this.manager.chartManager.getEditingNoteType()

      this.texts.getChildByName<BitmapText>("Chart").text =
        chart.difficulty + " " + chart.meter
    }

    if (Options.performance.smoothAnimations) {
      const easeTo = Number(
        this.manager.chartManager.getMode() != EditMode.Edit
      )
      this.easeVelocity += (easeTo - this.showEase) * 0.05
      this.showEase += this.easeVelocity
      this.easeVelocity *= 0.75
      this.background.height += (1 - this.showEase) * 40
    } else {
      if (this.manager.chartManager.getMode() == EditMode.Edit) {
        this.background.height += 40
      }
    }
    this.maskObj.height = this.background.height
  }
}
