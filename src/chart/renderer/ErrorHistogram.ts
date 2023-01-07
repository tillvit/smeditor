import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { GameplayStats } from "../play/GameplayStats"
import {
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "../play/TimingWindowCollection"

const HISTOGRAM_WIDTH = 300
const HISTOGRAM_HEIGHT = 150
const SCALING = [0.045, 0.09, 0.18, 0.37, 0.18, 0.09, 0.045]

interface HistogramLine extends Sprite {
  smoothCount: number
  targetHeight: number
}

interface Histogram extends Container {
  children: HistogramLine[]
}

interface LineContainer extends Container {
  children: Sprite[]
}

export class ErrorHistogram extends Container {
  private renderer: ChartRenderer
  private max = 0
  private barlines: Histogram = new Container() as Histogram
  private backgroundRect = new BetterRoundedRect()
  private background = new Container()
  private backgroundLines = new Container() as LineContainer

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.backgroundRect.tint = 0
    this.backgroundRect.alpha = 0.3
    this.background.addChild(this.backgroundRect)
    this.addChild(this.background)
    this.addChild(this.backgroundLines)

    const early = new BitmapText("Early", {
      fontName: "Assistant",
      fontSize: 15,
    })
    early.x = -HISTOGRAM_WIDTH / 2 + 5
    early.y = -HISTOGRAM_HEIGHT + 10
    early.alpha = 0.3
    this.background.addChild(early)

    const late = new BitmapText("Late", {
      fontName: "Assistant",
      fontSize: 15,
    })
    late.anchor.x = 1
    late.x = HISTOGRAM_WIDTH / 2 - 5
    late.y = -HISTOGRAM_HEIGHT + 10
    late.alpha = 0.3
    this.background.addChild(late)

    this.addChild(this.barlines)
  }

  renderThis() {
    this.x =
      -this.renderer.chartManager.app.renderer.screen.width / 2 +
      20 +
      HISTOGRAM_WIDTH / 2
    this.y = this.renderer.chartManager.app.renderer.screen.height / 2 - 20
    this.backgroundRect.width = HISTOGRAM_WIDTH + 10
    this.backgroundRect.height = HISTOGRAM_HEIGHT
    this.backgroundRect.x = -HISTOGRAM_WIDTH / 2 - 5
    this.backgroundRect.y = -HISTOGRAM_HEIGHT
    this.background.visible = !!this.renderer.chartManager.gameStats
    for (const line of this.barlines.children) {
      if (Options.performance.smoothAnimations)
        line.height = (line.targetHeight - line.height) * 0.2 + line.height
      else line.height = line.targetHeight
    }
  }

  private newLine(): HistogramLine {
    const line: HistogramLine = new Sprite(Texture.WHITE) as HistogramLine
    line.smoothCount = 0
    line.targetHeight = 0
    line.anchor.y = 1
    line.anchor.x = 0.5
    line.height = 0
    this.barlines.addChild(line)
    return line
  }

  start(gameStats: GameplayStats) {
    this.max = 0
    destroyChildIf(this.barlines.children, () => true)
    destroyChildIf(this.backgroundLines.children, () => true)

    const windowSize = Math.round(
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).maxWindowMS()
    )
    for (let i = 0; i < windowSize * 2; i++) {
      const line = this.newLine()
      line.width = HISTOGRAM_WIDTH / windowSize / 2
      line.x = (i - windowSize) * line.width
      this.barlines.addChild(line)
    }
    for (const window of TimingWindowCollection.getCollection(
      Options.play.timingCollection
    )
      .getStandardWindows()
      .reverse()) {
      const ms = window.getTimingWindowMS()
      if (ms == 0) continue
      for (let mult = -1; mult <= 1; mult += 2) {
        const line = new Sprite(Texture.WHITE)
        line.anchor.y = 1
        line.anchor.x = 0.5
        line.height = HISTOGRAM_HEIGHT
        line.tint = window.color
        line.alpha = 0.2
        line.width = 1
        line.x = (ms * mult * HISTOGRAM_WIDTH) / windowSize / 2
        this.backgroundLines.addChild(line)
      }
      for (let i = -ms + windowSize; i < ms + windowSize; i++) {
        this.barlines.children[Math.round(i)].tint = window.color
      }
    }
    const line = new Sprite(Texture.WHITE)
    line.anchor.y = 1
    line.anchor.x = 0.5
    line.height = HISTOGRAM_HEIGHT
    line.alpha = 0.2
    line.width = 1
    line.tint = 0x888888
    this.backgroundLines.addChild(line)
    gameStats.onJudge((error, judge) => {
      if (isStandardMissTimingWindow(judge)) return
      if (!isStandardTimingWindow(judge)) return
      const ms = Math.round(error * 1000)
      for (let i = -3; i <= 3; i++) {
        if (!this.barlines.children[ms + windowSize + i]) continue
        this.barlines.children[ms + windowSize + i].smoothCount +=
          SCALING[i + 3]
        if (
          this.barlines.children[ms + windowSize + i].smoothCount > this.max
        ) {
          this.max = this.barlines.children[ms + windowSize + i].smoothCount
        }
      }
      this.redraw()
    })
  }

  private redraw() {
    for (const line of this.barlines.children) {
      line.targetHeight =
        (line.smoothCount * (HISTOGRAM_HEIGHT - 20)) / this.max
    }
  }
}
