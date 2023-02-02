import { BitmapText, Container } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { TimerStats } from "../../util/TimerStats"
import {
  destroyChildIf,
  getFPS,
  getMemoryString,
  getTPS,
  roundDigit,
} from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const WIDGET_WIDTH = 310

export class InfoWidget extends Widget {
  background = new BetterRoundedRect()
  maskObj = new BetterRoundedRect()
  items = new Container()
  texts = new Container<BitmapText>()
  noteCounts = new Container<BitmapText>()
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
    this.addChild(this.maskObj, this.items)
    this.items.addChild(this.texts, this.noteCounts)

    this.items.mask = this.maskObj
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

    const renderStats = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    renderStats.name = "RStats"
    renderStats.x = 290
    renderStats.y = 50
    renderStats.align = "right"
    renderStats.visible = false
    renderStats.anchor.x = 1
    this.texts.addChild(renderStats)

    EventHandler.on("chartLoaded", () => {
      destroyChildIf(this.noteCounts.children, () => true)
      if (!this.manager.chartManager.chart) return
      const stats = this.manager.chartManager.chart.getNotedataStats().counts
      let numLines = 0
      for (const type in stats) {
        const text = new BitmapText(`${type}: ${stats[type]}`, {
          fontName: "Assistant",
          fontSize: 18,
        })
        text.name = type
        text.x = 20 + 150 * (numLines % 2)
        text.y = Math.floor(numLines++ / 2) * 18
        this.noteCounts.addChild(text)
      }
    })

    EventHandler.on("chartModified", () => {
      if (!this.manager.chartManager.chart) return
      const stats = this.manager.chartManager.chart.getNotedataStats().counts
      for (const type in stats) {
        const text = this.noteCounts.getChildByName<BitmapText>(type)
        text.text = `${type}: ${stats[type]}`
      }
    })

    this.noteCounts.y = 180
  }

  update(): void {
    this.visible = !!this.manager.chartManager.sm
    this.x = -this.manager.app.renderer.screen.width / 2 + 15
    this.y = -this.manager.app.renderer.screen.height / 2 + 20
    this.background.height = 150
    this.maskObj.height = 150

    const chart = this.manager.chartManager.chart

    this.texts.getChildByName<BitmapText>("Mode").text =
      this.manager.chartManager.getMode()
    this.texts.getChildByName<BitmapText>("Info").text =
      "\nTime: " +
      roundDigit(this.manager.chartManager.getTime(), 3) +
      "\nBeat: " +
      roundDigit(this.manager.chartManager.getBeat(), 3) +
      "\nBPM: " +
      (chart
        ? roundDigit(
            chart.timingData.getBPM(this.manager.chartManager.getBeat()),
            3
          )
        : "-") +
      "\n\nNote Type: " +
      this.manager.chartManager.getEditingNoteType()

    this.texts.getChildByName<BitmapText>("Chart").text = chart
      ? `${chart.difficulty} ${chart.meter}`
      : "No Chart"

    const renderStats = this.texts.getChildByName<BitmapText>("RStats")
    renderStats.visible = Options.debug.renderingStats
    if (Options.debug.renderingStats) {
      renderStats.text =
        getFPS() + " FPS\n" + getTPS() + " TPS\n" + getMemoryString() + "\n"
      if (Options.debug.showTimers) {
        for (const timer of TimerStats.getTimers()) {
          renderStats.text +=
            timer.name + ": " + timer.lastTime.toFixed(3) + "ms\n"
        }
      }
    }

    if (Options.general.smoothAnimations) {
      const easeTo = Number(
        this.manager.chartManager.getMode() != EditMode.Edit
      )
      this.easeVelocity += (easeTo - this.showEase) * 0.05
      this.showEase += this.easeVelocity
      this.easeVelocity *= 0.75
      this.background.height +=
        (1 - this.showEase) * (50 + this.noteCounts.height)
    } else {
      if (this.manager.chartManager.getMode() == EditMode.Edit) {
        this.background.height += 50 + this.noteCounts.height
      }
    }
    this.maskObj.height = this.background.height
  }
}
