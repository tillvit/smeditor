import { Container } from "pixi.js"
import { App } from "../../App"
import { ChartManager } from "../../chart/ChartManager"
import { CaptureStatusWidget } from "./CaptureStatusWidget"
import { DancingBotWidget } from "./DancingBotWidget"
import { DebugWidget } from "./DebugWidget"
import { NPSGraphWidget } from "./NPSGraphWidget"
import { NoteLayoutWidget } from "./NoteLayoutWidget"
import { PlayInfoWidget } from "./PlayInfoWidget"
import { PlaybackOptionsWidget } from "./PlaybackOptionsWidget"
import { StatusWidget } from "./StatusWidget"
import { Widget } from "./Widget"

export class WidgetManager extends Container {
  app: App
  chartManager: ChartManager
  children: Widget[] = []

  constructor(chartManager: ChartManager) {
    super()
    this.app = chartManager.app
    this.chartManager = chartManager
    this.addChild(new NoteLayoutWidget(this))
    this.addChild(new PlayInfoWidget(this))
    this.addChild(new StatusWidget(this))
    this.addChild(new DebugWidget(this))
    this.addChild(new NPSGraphWidget(this))
    this.addChild(new PlaybackOptionsWidget(this))
    this.addChild(new CaptureStatusWidget(this))
    this.addChild(new DancingBotWidget(this))
    this.zIndex = 2
  }

  update() {
    this.children.forEach(child => child.update())
  }

  startPlay() {
    this.children.forEach(child => child.startPlay())
  }

  endPlay() {
    this.children.forEach(child => child.endPlay())
  }
}
