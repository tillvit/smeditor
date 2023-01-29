import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "../../chart/play/TimingWindowCollection"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import {
  destroyChildIf,
  mean,
  median,
  roundDigit,
  stdDev,
} from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const WIDGET_WIDTH = 300
const HISTOGRAM_HEIGHT = 150
const SCALING = [0.045, 0.09, 0.18, 0.37, 0.18, 0.09, 0.045]

interface HistogramLine extends Sprite {
  smoothCount: number
  targetHeight: number
}

export class PlayInfoWidget extends Widget {
  private max = 0
  private barlines = new Container<HistogramLine>()
  private backgroundRect = new BetterRoundedRect()
  private background = new Container()
  private backgroundLines = new Container<Sprite>()
  private statText = new Container()
  private meanText: BitmapText
  private medianText: BitmapText
  private modeText: BitmapText
  private stddevText: BitmapText
  private errorMS: number[] = []

  private texts = new Container<BitmapText>()

  private showEase = 0
  private easeVelocity = 0
  private toggled = false
  private hovered = false
  private drag = false
  private dragStart = 0

  constructor(manager: WidgetManager) {
    super(manager)
    this.visible = false
    this.backgroundRect.tint = 0
    this.backgroundRect.alpha = 0.3
    this.background.addChild(this.backgroundRect)
    this.addChild(this.background)
    this.addChild(this.backgroundLines)
    this.interactive = true

    this.on("mousedown", () => {
      if (this.manager.chartManager.getMode() == EditMode.Play) return
      this.drag = true
      this.dragStart = Date.now()
    })

    window.addEventListener("mousemove", event => {
      if (this.drag) {
        this.showEase += event.movementY / -350
      }
    })

    this.on("mouseup", () => {
      if (this.drag) {
        if (Date.now() - this.dragStart > 400) {
          this.toggled = this.showEase > 0.5
        } else {
          this.hovered = false
          this.toggled = !this.toggled
        }
      }
    })

    window.addEventListener("mouseup", () => {
      this.drag = false
    })

    this.on("mouseenter", () => {
      this.hovered = true
    })

    this.on("mouseleave", () => {
      this.hovered = false
    })

    const early = new BitmapText("Early", {
      fontName: "Assistant",
      fontSize: 15,
    })
    early.x = -WIDGET_WIDTH / 2 + 5
    early.y = -HISTOGRAM_HEIGHT + 10
    early.alpha = 0.3
    this.background.addChild(early)

    const late = new BitmapText("Late", {
      fontName: "Assistant",
      fontSize: 15,
    })
    late.anchor.x = 1
    late.x = WIDGET_WIDTH / 2 - 5
    late.y = -HISTOGRAM_HEIGHT + 10
    late.alpha = 0.3
    this.background.addChild(late)

    this.meanText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.meanText.anchor.x = 0.5
    this.meanText.x = (WIDGET_WIDTH / 4) * -1.5
    this.meanText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.meanText)

    this.medianText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.medianText.anchor.x = 0.5
    this.medianText.x = (WIDGET_WIDTH / 4) * -0.5
    this.medianText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.medianText)

    this.modeText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.modeText.anchor.x = 0.5
    this.modeText.x = (WIDGET_WIDTH / 4) * 0.5
    this.modeText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.modeText)

    this.stddevText = new BitmapText("-", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.stddevText.anchor.x = 0.5
    this.stddevText.x = (WIDGET_WIDTH / 4) * 1.5
    this.stddevText.y = -HISTOGRAM_HEIGHT - 20
    this.statText.addChild(this.stddevText)

    const meanLabel = new BitmapText("Mean", {
      fontName: "Assistant",
      fontSize: 10,
    })
    meanLabel.anchor.x = 0.5
    meanLabel.x = (WIDGET_WIDTH / 4) * -1.5
    meanLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(meanLabel)

    const medianLabel = new BitmapText("Median", {
      fontName: "Assistant",
      fontSize: 10,
    })
    medianLabel.anchor.x = 0.5
    medianLabel.x = (WIDGET_WIDTH / 4) * -0.5
    medianLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(medianLabel)

    const modeLabel = new BitmapText("Mode", {
      fontName: "Assistant",
      fontSize: 10,
    })
    modeLabel.anchor.x = 0.5
    modeLabel.x = (WIDGET_WIDTH / 4) * 0.5
    modeLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(modeLabel)

    const stddevLabel = new BitmapText("Std Dev.", {
      fontName: "Assistant",
      fontSize: 10,
    })
    stddevLabel.anchor.x = 0.5
    stddevLabel.x = (WIDGET_WIDTH / 4) * 1.5
    stddevLabel.y = -HISTOGRAM_HEIGHT - 30
    this.statText.addChild(stddevLabel)

    this.addChild(this.statText)
    this.addChild(this.barlines)
    this.addChild(this.texts)
  }

  update() {
    this.visible = !!this.manager.chartManager.gameStats
    this.x =
      -this.manager.chartManager.app.renderer.screen.width / 2 +
      20 +
      WIDGET_WIDTH / 2
    this.y = this.manager.chartManager.app.renderer.screen.height / 2 - 20
    this.backgroundRect.width = WIDGET_WIDTH + 10
    this.backgroundRect.height = HISTOGRAM_HEIGHT + 210
    this.backgroundRect.x = -WIDGET_WIDTH / 2 - 5
    this.backgroundRect.y = -HISTOGRAM_HEIGHT - 210
    this.visible = !!this.manager.chartManager.gameStats
    for (const line of this.barlines.children) {
      if (Options.performance.smoothAnimations)
        line.height = (line.targetHeight - line.height) * 0.2 + line.height
      else line.height = line.targetHeight
    }

    if (Options.performance.smoothAnimations) {
      const easeTo =
        this.manager.chartManager.getMode() == EditMode.Play || this.toggled
          ? 1
          : Number(this.hovered) * 0.05
      if (!this.drag) {
        this.easeVelocity += (easeTo - this.showEase) * 0.05
        this.showEase += this.easeVelocity
      }
      if (this.easeVelocity < 0 && this.showEase < 0) this.easeVelocity *= -1
      this.easeVelocity *= 0.75
      this.y += (1 - this.showEase) * 350
    } else {
      if (this.manager.chartManager.getMode() != EditMode.Play) this.y += 350
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
    destroyChildIf(this.texts.children, () => true)

    const collection = TimingWindowCollection.getCollection(
      Options.play.timingCollection
    )

    const numWindows = collection.getStandardWindows().length + 1

    const windowSize = Math.round(collection.maxWindowMS())
    for (let i = 0; i < windowSize * 2; i++) {
      const line = this.newLine()
      line.width = WIDGET_WIDTH / windowSize / 2
      line.x = (i - windowSize) * line.width
      this.barlines.addChild(line)
    }
    let i = 0
    for (const window of collection.getStandardWindows().reverse()) {
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
        line.x = (ms * mult * WIDGET_WIDTH) / windowSize / 2
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

    for (const window of [
      ...collection.getStandardWindows(),
      collection.getMissJudgment(),
    ]) {
      const label = new BitmapText(window.name, {
        fontName: "Assistant",
        fontSize: 15,
      })
      const count = new BitmapText("0", { fontName: "Assistant", fontSize: 15 })
      label.tint = window.color
      count.tint = window.color
      count.name = window.id
      this.texts.addChild(label)
      this.texts.addChild(count)
      label.x = -WIDGET_WIDTH / 2 + 10
      count.x = -WIDGET_WIDTH / 2 + 140
      label.y = (130 / numWindows) * i - HISTOGRAM_HEIGHT - 170
      count.y = (130 / numWindows) * i++ - HISTOGRAM_HEIGHT - 170
      label.anchor.y = 0.5
      count.anchor.y = 0.5
      count.anchor.x = 1
    }
    const extraNumWindows = collection.getHoldWindows().length + 2
    i = 0
    for (const window of [
      ...collection.getHoldWindows(),
      collection.getMineJudgment(),
    ]) {
      const name = isHoldTimingWindow(window) ? window.noteType : "Mine"
      const label = new BitmapText(name, {
        fontName: "Assistant",
        fontSize: 15,
      })
      const count = new BitmapText("0", {
        fontName: "Assistant",
        fontSize: 15,
      })
      if (name != "Mine")
        count.text =
          "0 / " +
          this.manager.chartManager.chart!.notedata.filter(
            note => note.type == name
          ).length
      label.tint = 0xdddddd
      count.tint = 0xdddddd
      count.name = name
      this.texts.addChild(label)
      this.texts.addChild(count)
      label.x = -WIDGET_WIDTH / 2 + 160
      count.x = -WIDGET_WIDTH / 2 + 290
      label.y = (80 / extraNumWindows) * i - HISTOGRAM_HEIGHT - 170
      count.y = (80 / extraNumWindows) * i++ - HISTOGRAM_HEIGHT - 170
      label.anchor.y = 0.5
      count.anchor.y = 0.5
      count.anchor.x = 1
    }

    const label = new BitmapText("Max Combo", {
      fontName: "Assistant",
      fontSize: 15,
    })
    const count = new BitmapText("0", {
      fontName: "Assistant",
      fontSize: 15,
    })
    label.tint = 0xdddddd
    count.tint = 0xdddddd
    count.name = "Combo"
    this.texts.addChild(label)
    this.texts.addChild(count)
    label.x = -WIDGET_WIDTH / 2 + 160
    count.x = -WIDGET_WIDTH / 2 + 290
    label.y = (80 / extraNumWindows) * i - HISTOGRAM_HEIGHT - 170
    count.y = (80 / extraNumWindows) * i++ - HISTOGRAM_HEIGHT - 170
    label.anchor.y = 0.5
    count.anchor.y = 0.5
    count.anchor.x = 1

    const score = new BitmapText("0.00 / 0.00", {
      fontName: "Assistant",
      fontSize: 20,
    })
    score.tint = 0xdddddd
    score.x = -WIDGET_WIDTH / 2 + 225
    score.y = -HISTOGRAM_HEIGHT - 62
    score.name = "Score"
    this.texts.addChild(score)
    score.anchor.set(0.5)

    const scoreLabel = new BitmapText("Score / Current Score", {
      fontName: "Assistant",
      fontSize: 13,
    })
    scoreLabel.tint = 0x888888
    scoreLabel.x = -WIDGET_WIDTH / 2 + 225
    scoreLabel.y = -HISTOGRAM_HEIGHT - 85
    this.texts.addChild(scoreLabel)
    scoreLabel.anchor.set(0.5)

    const windowLabel = new BitmapText("Play Statistics", {
      fontName: "Assistant",
      fontSize: 13,
    })
    windowLabel.y = -HISTOGRAM_HEIGHT - 195
    windowLabel.anchor.set(0.5)
    this.texts.addChild(windowLabel)

    gameStats.onJudge((error, judge) => {
      let name = ""
      if (isStandardMissTimingWindow(judge) || isStandardTimingWindow(judge))
        name = judge.id
      if (isHoldTimingWindow(judge)) name = judge.noteType
      if (isMineTimingWindow(judge)) name = "Mine"
      const text = this.texts.getChildByName<BitmapText>(name)
      if (isHoldTimingWindow(judge)) {
        const max = text.text.split(" / ")[1]
        text.text = gameStats.getCount(judge) + " / " + max
      } else if (!isHoldDroppedTimingWindow(judge)) {
        text.text = gameStats.getCount(judge) + ""
      }
      this.texts.getChildByName<BitmapText>("Combo").text =
        gameStats.getMaxCombo() + ""
      this.texts.getChildByName<BitmapText>("Score").text =
        roundDigit(gameStats.getScore() * 100, 2).toFixed(2) +
        " / " +
        roundDigit(gameStats.getCumulativeScore() * 100, 2).toFixed(2)
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
