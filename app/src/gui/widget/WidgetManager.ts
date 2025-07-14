import { Container } from "pixi.js"
import { App } from "../../App"
import { ChartManager } from "../../chart/ChartManager"
import { CaptureStatusWidget } from "./CaptureStatusWidget"
import { DancingBotWidget } from "./DancingBotWidget"
import { DebugWidget } from "./DebugWidget"
import { PlayInfoWidget } from "./PlayInfoWidget"
import { PlaybackOptionsWidget } from "./PlaybackOptionsWidget"
import { StatusWidget } from "./StatusWidget"
import { Widget } from "./Widget"
import { DensityWidget } from "./timeline/DensityWidget"
import { FacingLayoutWidget } from "./timeline/FacingWidget"
import { NoteLayoutWidget } from "./timeline/NoteLayoutWidget"

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
    this.addChild(new DensityWidget(this))
    this.addChild(new PlaybackOptionsWidget(this))
    this.addChild(new FacingLayoutWidget(this))
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
