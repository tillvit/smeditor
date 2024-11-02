import bezier from "bezier-easing"
import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import {
  TimingWindowCollection,
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
} from "../../chart/play/TimingWindowCollection"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { BezierAnimator } from "../../util/BezierEasing"
import { assignTint } from "../../util/Color"
import { mean, median, roundDigit, stdDev } from "../../util/Math"
import { Options } from "../../util/Options"
import { destroyChildIf } from "../../util/Util"
import { WaterfallManager } from "../element/WaterfallManager"
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
  private backgroundRect = new BetterRoundedRect("noBorder")
  private background = new Container()
  private backgroundLines = new Container<Sprite>()
  private statText = new Container()
  private readonly meanText: BitmapText
  private readonly medianText: BitmapText
  private readonly modeText: BitmapText
  private readonly stddevText: BitmapText
  private errorMS: number[] = []

  private texts = new Container<BitmapText>()

  showEase = 0
  private toggled = false
  private drag = false
  private dragStart = 0
  private lastMode = this.manager.chartManager.getMode()

  constructor(manager: WidgetManager) {
    super(manager)
    this.visible = false

    this.background.addChild(this.backgroundRect)
    assignTint(this.backgroundRect, "widget-bg")
    this.addChild(this.background)
    this.addChild(this.backgroundLines)
    this.eventMode = "static"

    this.on("mousedown", () => {
      if (this.manager.chartManager.getMode() == EditMode.Play) return
      this.drag = true
      this.dragStart = Date.now()
      BezierAnimator.stop("play-widget")
    })

    window.addEventListener("mousemove", event => {
      if (this.drag) {
        this.showEase += event.movementY / -400
      }
    })

    window.addEventListener("mouseup", () => {
      if (this.drag) {
        if (Date.now() - this.dragStart > 400) {
          this.toggled = this.showEase > 0.5
        } else {
          this.toggled = !this.toggled
        }
        BezierAnimator.animate(
          this,
          {
            0: { showEase: "inherit" },
            1: { showEase: this.toggled ? 1 : 0 },
          },
          0.6,
          bezier(0.11, 0.71, 0.33, 1.39),
          () => {},
          "play-widget"
        )
      }
      this.drag = false
    })

    this.on("mouseenter", () => {
      if (
        !this.toggled &&
        this.manager.chartManager.getMode() != EditMode.Play
      ) {
        BezierAnimator.animate(
          this,
          {
            0: { showEase: "inherit" },
            1: { showEase: 0.05 },
          },
          0.6,
          bezier(0.11, 0.71, 0.33, 1.39),
          () => {},
          "play-widget"
        )
      }
    })

    this.on("mouseleave", () => {
      if (
        !this.toggled &&
        this.manager.chartManager.getMode() != EditMode.Play
      ) {
        BezierAnimator.animate(
          this,
          {
            0: { showEase: "inherit" },
            1: { showEase: 0 },
          },
          0.6,
          bezier(0.11, 0.71, 0.33, 1.39),
          () => {},
          "play-widget"
        )
      }
    })

    const early = new BitmapText("Early", {
      fontName: "Main",
      fontSize: 15,
    })
    early.x = -WIDGET_WIDTH / 2 + 5
    early.y = -HISTOGRAM_HEIGHT - 40
    early.alpha = 0.3
    this.background.addChild(early)
    assignTint(early, "text-color")

    const late = new BitmapText("Late", {
      fontName: "Main",
      fontSize: 15,
    })
    late.anchor.x = 1
    late.x = WIDGET_WIDTH / 2 - 5
    late.y = -HISTOGRAM_HEIGHT - 40
    late.alpha = 0.3
    this.background.addChild(late)
    assignTint(late, "text-color")

    this.meanText = new BitmapText("-", {
      fontName: "Main",
      fontSize: 15,
    })
    this.meanText.anchor.x = 0.5
    this.meanText.x = (WIDGET_WIDTH / 4) * -1.5
    this.meanText.y = -HISTOGRAM_HEIGHT - 70
    this.statText.addChild(this.meanText)

    this.medianText = new BitmapText("-", {
      fontName: "Main",
      fontSize: 15,
    })
    this.medianText.anchor.x = 0.5
    this.medianText.x = (WIDGET_WIDTH / 4) * -0.5
    this.medianText.y = -HISTOGRAM_HEIGHT - 70
    this.statText.addChild(this.medianText)

    this.modeText = new BitmapText("-", {
      fontName: "Main",
      fontSize: 15,
    })
    this.modeText.anchor.x = 0.5
    this.modeText.x = (WIDGET_WIDTH / 4) * 0.5
    this.modeText.y = -HISTOGRAM_HEIGHT - 70
    this.statText.addChild(this.modeText)

    this.stddevText = new BitmapText("-", {
      fontName: "Main",
      fontSize: 15,
    })
    this.stddevText.anchor.x = 0.5
    this.stddevText.x = (WIDGET_WIDTH / 4) * 1.5
    this.stddevText.y = -HISTOGRAM_HEIGHT - 70
    this.statText.addChild(this.stddevText)

    const meanLabel = new BitmapText("Mean", {
      fontName: "Main",
      fontSize: 10,
    })
    meanLabel.anchor.x = 0.5
    meanLabel.x = (WIDGET_WIDTH / 4) * -1.5
    meanLabel.y = -HISTOGRAM_HEIGHT - 80
    this.statText.addChild(meanLabel)

    const medianLabel = new BitmapText("Median", {
      fontName: "Main",
      fontSize: 10,
    })
    medianLabel.anchor.x = 0.5
    medianLabel.x = (WIDGET_WIDTH / 4) * -0.5
    medianLabel.y = -HISTOGRAM_HEIGHT - 80
    this.statText.addChild(medianLabel)

    const modeLabel = new BitmapText("Mode", {
      fontName: "Main",
      fontSize: 10,
    })
    modeLabel.anchor.x = 0.5
    modeLabel.x = (WIDGET_WIDTH / 4) * 0.5
    modeLabel.y = -HISTOGRAM_HEIGHT - 80
    this.statText.addChild(modeLabel)

    const stddevLabel = new BitmapText("Std Dev.", {
      fontName: "Main",
      fontSize: 10,
    })
    stddevLabel.anchor.x = 0.5
    stddevLabel.x = (WIDGET_WIDTH / 4) * 1.5
    stddevLabel.y = -HISTOGRAM_HEIGHT - 80
    this.statText.addChild(stddevLabel)

    this.statText.children.forEach(child => {
      assignTint(child as BitmapText, "text-color")
    })

    const alignSongContainer = new Container()

    const alignSongBg = new BetterRoundedRect("noBorder")
    alignSongBg.tint = 0x333333
    alignSongBg.alpha = 0.3
    alignSongBg.width = WIDGET_WIDTH / 2 - 10
    alignSongBg.height = 30
    alignSongBg.y = -25
    alignSongBg.x = -WIDGET_WIDTH / 4
    alignSongBg.pivot.x = (WIDGET_WIDTH / 2 - 10) / 2
    alignSongBg.pivot.y = 15
    const alignSongText = new BitmapText("Adjust song offset", {
      fontName: "Main",
      fontSize: 12,
    })
    alignSongText.anchor.set(0.5)
    alignSongText.x = -WIDGET_WIDTH / 4
    alignSongText.y = -25
    alignSongContainer.addChild(alignSongBg, alignSongText)

    alignSongContainer.eventMode = "static"
    alignSongContainer.addEventListener("mouseenter", () => {
      alignSongBg.alpha = 0.6
    })
    alignSongContainer.addEventListener("mousedown", event => {
      event.stopImmediatePropagation()
      this.adjustOffset("song")
    })
    alignSongContainer.addEventListener("mouseleave", () => {
      alignSongBg.alpha = 0.3
    })
    this.statText.addChild(alignSongContainer)
    assignTint(alignSongText, "text-color")

    const alignGlobalContainer = new Container()

    const alignGlobalBg = new BetterRoundedRect("noBorder")
    alignGlobalBg.tint = 0x333333
    alignGlobalBg.alpha = 0.3
    alignGlobalBg.width = WIDGET_WIDTH / 2 - 10
    alignGlobalBg.height = 30
    alignGlobalBg.y = -25
    alignGlobalBg.x = WIDGET_WIDTH / 4
    alignGlobalBg.pivot.x = (WIDGET_WIDTH / 2 - 10) / 2
    alignGlobalBg.pivot.y = 15
    alignGlobalBg.eventMode = "static"
    alignGlobalContainer.addEventListener("mouseenter", () => {
      alignGlobalBg.alpha = 0.6
    })
    alignGlobalContainer.addEventListener("mouseleave", () => {
      alignGlobalBg.alpha = 0.3
    })

    const alignGlobalText = new BitmapText("Adjust global offset", {
      fontName: "Main",
      fontSize: 12,
    })
    alignGlobalText.anchor.set(0.5)
    alignGlobalText.x = WIDGET_WIDTH / 4
    alignGlobalText.y = -25
    alignGlobalContainer.addChild(alignGlobalBg, alignGlobalText)
    assignTint(alignGlobalText, "text-color")

    alignGlobalContainer.eventMode = "static"
    alignGlobalContainer.addEventListener("mouseenter", () => {
      alignGlobalBg.alpha = 0.6
    })
    alignGlobalContainer.addEventListener("mousedown", event => {
      event.stopImmediatePropagation()
      this.adjustOffset("global")
    })
    alignGlobalContainer.addEventListener("mouseleave", () => {
      alignGlobalBg.alpha = 0.3
    })
    this.statText.addChild(alignGlobalContainer)

    this.addChild(this.background)
    this.addChild(this.backgroundLines)
    this.eventMode = "static"

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
    this.backgroundRect.height = HISTOGRAM_HEIGHT + 260
    this.backgroundRect.x = -WIDGET_WIDTH / 2 - 5
    this.backgroundRect.y = -HISTOGRAM_HEIGHT - 260
    this.visible = !!this.manager.chartManager.gameStats
    for (const line of this.barlines.children) {
      if (Options.general.smoothAnimations)
        line.height = (line.targetHeight - line.height) * 0.2 + line.height
      else line.height = line.targetHeight
    }

    if (this.lastMode != this.manager.chartManager.getMode()) {
      this.lastMode = this.manager.chartManager.getMode()
      BezierAnimator.animate(
        this,
        {
          0: { showEase: "inherit" },
          1: {
            showEase:
              this.manager.chartManager.getMode() == EditMode.Play ? 1 : 0,
          },
        },
        0.6,
        bezier(0.11, 0.71, 0.33, 1.39),
        () => {},
        "play-widget"
      )
    }

    if (Options.general.smoothAnimations) {
      this.y += (1 - Math.abs(this.showEase)) * 400
    } else {
      if (this.manager.chartManager.getMode() != EditMode.Play) this.y += 400
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
      line.y = -50
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
        line.y = -50
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
    line.y = -50
    this.backgroundLines.addChild(line)

    for (const window of [
      ...collection.getStandardWindows(),
      collection.getMissJudgement(),
    ]) {
      const label = new BitmapText(window.name, {
        fontName: "Main",
        fontSize: 15,
      })
      const count = new BitmapText("0", { fontName: "Main", fontSize: 15 })
      label.tint = window.color
      count.tint = window.color
      count.name = window.id
      this.texts.addChild(label)
      this.texts.addChild(count)
      label.x = -WIDGET_WIDTH / 2 + 10
      count.x = -WIDGET_WIDTH / 2 + 140
      label.y = (130 / numWindows) * i - HISTOGRAM_HEIGHT - 220
      count.y = (130 / numWindows) * i++ - HISTOGRAM_HEIGHT - 220
      label.anchor.y = 0.5
      count.anchor.y = 0.5
      count.anchor.x = 1
    }
    const ht =
      this.manager.chartManager.loadedChart?.gameType.gameLogic.usesHoldTicks ??
      false
    const extraNumWindows = (ht ? 0 : collection.getHoldWindows().length) + 2
    i = 0
    for (const window of ht
      ? [collection.getMineJudgement()]
      : [...collection.getHoldWindows(), collection.getMineJudgement()]) {
      const name = isHoldTimingWindow(window) ? window.noteType : "Mine"
      const label = new BitmapText(name, {
        fontName: "Main",
        fontSize: 15,
      })
      const count = new BitmapText("0", {
        fontName: "Main",
        fontSize: 15,
      })
      assignTint(label, "text-color")
      assignTint(count, "text-color")
      if (name != "Mine")
        count.text =
          "0 / " +
          this.manager.chartManager
            .loadedChart!.getNotedata()
            .filter(note => note.type == name && !note.fake).length
      label.alpha = 0.8
      count.alpha = 0.8
      count.name = name
      this.texts.addChild(label)
      this.texts.addChild(count)
      label.x = -WIDGET_WIDTH / 2 + 160
      count.x = -WIDGET_WIDTH / 2 + 290
      label.y = (80 / extraNumWindows) * i - HISTOGRAM_HEIGHT - 220
      count.y = (80 / extraNumWindows) * i++ - HISTOGRAM_HEIGHT - 220
      label.anchor.y = 0.5
      count.anchor.y = 0.5
      count.anchor.x = 1
    }

    const label = new BitmapText("Max Combo", {
      fontName: "Main",
      fontSize: 15,
    })
    assignTint(label, "text-color")
    const count = new BitmapText("0", {
      fontName: "Main",
      fontSize: 15,
    })
    assignTint(count, "text-color")
    label.alpha = 0.8
    count.alpha = 0.8
    count.name = "Combo"
    this.texts.addChild(label)
    this.texts.addChild(count)
    label.x = -WIDGET_WIDTH / 2 + 160
    count.x = -WIDGET_WIDTH / 2 + 290
    label.y = (80 / extraNumWindows) * i - HISTOGRAM_HEIGHT - 220
    count.y = (80 / extraNumWindows) * i++ - HISTOGRAM_HEIGHT - 220
    label.anchor.y = 0.5
    count.anchor.y = 0.5
    count.anchor.x = 1

    const score = new BitmapText("0.00 / 0.00", {
      fontName: "Main",
      fontSize: 20,
    })
    assignTint(score, "text-color")
    score.alpha = 0.8
    score.x = -WIDGET_WIDTH / 2 + 225
    score.y = -HISTOGRAM_HEIGHT - 112
    score.name = "Score"
    this.texts.addChild(score)
    score.anchor.set(0.5)

    const scoreLabel = new BitmapText("Score / Current Score", {
      fontName: "Main",
      fontSize: 13,
    })
    assignTint(scoreLabel, "text-color")
    scoreLabel.alpha = 0.5
    scoreLabel.x = -WIDGET_WIDTH / 2 + 225
    scoreLabel.y = -HISTOGRAM_HEIGHT - 135
    this.texts.addChild(scoreLabel)
    scoreLabel.anchor.set(0.5)

    const windowLabel = new BitmapText("Play Statistics", {
      fontName: "Main",
      fontSize: 13,
    })
    windowLabel.y = -HISTOGRAM_HEIGHT - 245
    windowLabel.anchor.set(0.5)
    assignTint(windowLabel, "text-color")
    this.texts.addChild(windowLabel)

    gameStats.onJudge((error, judge) => {
      let name = ""
      if (isStandardMissTimingWindow(judge) || isStandardTimingWindow(judge))
        name = judge.id
      if (isHoldTimingWindow(judge)) name = judge.noteType
      if (isMineTimingWindow(judge)) name = "Mine"
      const text = this.texts.getChildByName<BitmapText>(name)!
      if (isHoldTimingWindow(judge)) {
        const max = text.text.split(" / ")[1]
        text.text = gameStats.getCount(judge) + " / " + max
      } else if (!isHoldDroppedTimingWindow(judge)) {
        text.text = gameStats.getCount(judge) + ""
      }
      this.texts.getChildByName<BitmapText>("Combo")!.text =
        gameStats.getMaxCombo() + ""
      this.texts.getChildByName<BitmapText>("Score")!.text =
        roundDigit(gameStats.getScore() * 100, 2).toFixed(2) +
        " / " +
        roundDigit(gameStats.getCumulativeScore() * 100, 2).toFixed(2)
      if (isStandardMissTimingWindow(judge)) return
      if (!isStandardTimingWindow(judge)) return
      if (error == null) return
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

  private adjustOffset(type: string) {
    const gameStats = this.manager.chartManager.gameStats
    if (!gameStats) return
    const offset = Math.round(gameStats.getMedian() * 1000) / 1000
    if (offset == 0) return
    gameStats.applyOffset(-offset)
    this.barlines.children.forEach(bar => {
      bar.smoothCount = 0
    })
    const collection = TimingWindowCollection.getCollection(
      Options.play.timingCollection
    )
    const windowSize = Math.round(collection.maxWindowMS())
    gameStats.getDataPoints().forEach(point => {
      if (isStandardMissTimingWindow(point.judgement)) return
      if (!isStandardTimingWindow(point.judgement)) return
      if (point.error === null) return
      const ms = Math.round(point.error * 1000)
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
    })
    this.redraw()
    const oldOffset =
      type == "global"
        ? Options.play.offset
        : this.manager.app.chartManager.loadedChart!.timingData.getOffset()
    if (type == "global") {
      Options.play.offset = roundDigit(Options.play.offset - offset, 3)
    } else if (type == "song") {
      const target =
        this.manager.app.chartManager.loadedChart!.timingData.hasChartOffset()
          ? this.manager.app.chartManager.loadedChart!.timingData
          : this.manager.app.chartManager.loadedSM!.timingData
      target.setOffset(roundDigit(target.getOffset() - offset, 3))
    }
    WaterfallManager.create(
      `Adjusted ${type} offset from ${roundDigit(oldOffset, 3).toFixed(
        3
      )} to ${roundDigit(oldOffset - offset, 3).toFixed(3)}`
    )
  }
}
