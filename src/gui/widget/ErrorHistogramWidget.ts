import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf, mean, median, stdDev } from "../../util/Util"
import {
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "../../chart/play/TimingWindowCollection"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

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

export class ErrorHistrogramWidget extends Widget {
  private max = 0
  private barlines: Histogram = new Container() as Histogram
  private backgroundRect = new BetterRoundedRect()
  private background = new Container()
  private backgroundLines = new Container() as LineContainer
  private statText = new Container()
  private meanText: BitmapText
  private medianText: BitmapText
  private modeText: BitmapText
  private stddevText: BitmapText
  private errorMS: number[] = []

  constructor(manager: WidgetManager) {
    super(manager)
    this.visible = false
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

    this.meanText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.meanText.anchor.x = 0.5
    this.meanText.x = (HISTOGRAM_WIDTH / 4) * -1.5
    this.meanText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.meanText)

    this.medianText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.medianText.anchor.x = 0.5
    this.medianText.x = (HISTOGRAM_WIDTH / 4) * -0.5
    this.medianText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.medianText)

    this.modeText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.modeText.anchor.x = 0.5
    this.modeText.x = (HISTOGRAM_WIDTH / 4) * 0.5
    this.modeText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.modeText)

    this.stddevText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.stddevText.anchor.x = 0.5
    this.stddevText.x = (HISTOGRAM_WIDTH / 4) * 1.5
    this.stddevText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.stddevText)

    const meanLabel = new BitmapText("Mean", {
      fontName: "Assistant",
      fontSize: 10,
    })
    meanLabel.anchor.x = 0.5
    meanLabel.x = (HISTOGRAM_WIDTH / 4) * -1.5
    meanLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(meanLabel)

    const medianLabel = new BitmapText("Median", {
      fontName: "Assistant",
      fontSize: 10,
    })
    medianLabel.anchor.x = 0.5
    medianLabel.x = (HISTOGRAM_WIDTH / 4) * -0.5
    medianLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(medianLabel)

    const modeLabel = new BitmapText("Mode", {
      fontName: "Assistant",
      fontSize: 10,
    })
    modeLabel.anchor.x = 0.5
    modeLabel.x = (HISTOGRAM_WIDTH / 4) * 0.5
    modeLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(modeLabel)

    const stddevLabel = new BitmapText("Std Dev.", {
      fontName: "Assistant",
      fontSize: 10,
    })
    stddevLabel.anchor.x = 0.5
    stddevLabel.x = (HISTOGRAM_WIDTH / 4) * 1.5
    stddevLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(stddevLabel)

    this.addChild(this.statText)

    this.addChild(this.barlines)
  }

  update() {
    this.visible = !!this.manager.chartManager.gameStats
    this.x =
      -this.manager.chartManager.app.renderer.screen.width / 2 +
      20 +
      HISTOGRAM_WIDTH / 2
    this.y = this.manager.chartManager.app.renderer.screen.height / 2 - 20
    this.backgroundRect.width = HISTOGRAM_WIDTH + 10
    this.backgroundRect.height = HISTOGRAM_HEIGHT + 35
    this.backgroundRect.x = -HISTOGRAM_WIDTH / 2 - 5
    this.backgroundRect.y = -HISTOGRAM_HEIGHT - 35
    this.visible = !!this.manager.chartManager.gameStats
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
    line.visible = false
    this.barlines.addChild(line)
    return line
  }

  startPlay() {
    const gameStats = this.manager.chartManager.gameStats!
    this.max = 0
    this.errorMS = []
    this.meanText.text = "-"
    this.medianText.text = "-"
    this.modeText.text = "-"
    this.stddevText.text = "-"
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
      const ms = Math.round(window.getTimingWindowMS())
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
        this.barlines.children[ms + windowSize + i].visible = true
        if (
          this.barlines.children[ms + windowSize + i].smoothCount > this.max
        ) {
          this.modeText.text = ms + "ms"
          this.max = this.barlines.children[ms + windowSize + i].smoothCount
        }
      }
      this.errorMS.push(error * 1000)
      this.meanText.text = mean(this.errorMS).toFixed(2) + "ms"
      this.medianText.text = median(this.errorMS).toFixed(2) + "ms"
      this.stddevText.text = stdDev(this.errorMS).toFixed(2) + "ms"
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
