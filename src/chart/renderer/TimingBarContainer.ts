import { BitmapText, Container, Graphics, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { clamp, destroyChildIf, lerp, median } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingWindow } from "../play/TimingWindow"
import {
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "../play/TimingWindowCollection"

interface TimingBarlineObject extends Sprite {
  createTime: number
  ms: number
  miss: boolean
}

interface TimingBarlineContainer extends Container {
  children: TimingBarlineObject[]
}

const BAR_WIDTH = 1
const BAR_HEIGHT = 15

const errorStyle = {
  fontName: "Assistant-Fancy",
  fontSize: 12,
}

export class TimingBarContainer extends Container {
  private barlines: TimingBarlineContainer =
    new Container() as TimingBarlineContainer
  private barline: Sprite
  private currentMedian: Graphics
  private errorText: BitmapText = new BitmapText("", errorStyle)
  private errorTextTime = -1
  private renderer: ChartRenderer
  private target = 0

  constructor(renderer: ChartRenderer) {
    super()
    this.y = 10
    this.renderer = renderer
    this.barline = new Sprite(Texture.WHITE)
    this.barline.anchor.set(0.5)
    this.barline.height = 1
    this.barline.alpha = 0.5
    const target = new Sprite(Texture.WHITE)
    target.width = 2
    target.height = BAR_HEIGHT
    target.anchor.set(0.5)
    this.currentMedian = new Graphics()
    this.currentMedian.beginFill(0xffffff)
    this.currentMedian.moveTo(0, -10)
    this.currentMedian.lineTo(5, -15)
    this.currentMedian.lineTo(-5, -15)
    this.currentMedian.lineTo(0, -10)
    this.errorText.y = -25
    this.errorText.anchor.set(0.5)
    this.addChild(this.barline)
    this.addChild(target)
    this.addChild(this.barlines)
    this.addChild(this.currentMedian)

    this.addChild(this.errorText)
  }

  renderThis() {
    this.visible = this.renderer.chartManager.getMode() == EditMode.Play
    for (const child of this.barlines.children) {
      const barline = child
      const t = (Date.now() - barline.createTime) / 5000
      if (t < 0.05) child.alpha = 1
      else if (t < 0.3) child.alpha = lerp(1, 0.2, (t - 0.05) / 0.25)
      else if (t < 0.9) child.alpha = 0.2
      else child.alpha = (1 - t) * 3
    }
    this.errorText.alpha = clamp(
      (2000 - (Date.now() - this.errorTextTime)) / 1000,
      0,
      1
    )
    this.barline.width =
      (TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).maxWindowMS() /
        1000) *
      2 *
      400
    destroyChildIf(
      this.barlines.children,
      child => Date.now() - child.createTime > 5000
    )
    if (Options.general.smoothAnimations)
      this.currentMedian.x =
        (this.currentMedian.x - this.target) * 0.8 + this.target
    else this.currentMedian.x = this.target
    this.errorText.scale.y = Options.chart.reverse ? -1 : 1
    this.errorText.y = Options.chart.reverse ? 25 : -25
    this.currentMedian.scale.y = Options.chart.reverse ? -1 : 1
  }

  addBar(error: number, judge: TimingWindow) {
    if (!isStandardMissTimingWindow(judge) && !isStandardTimingWindow(judge))
      return
    const bar = new Sprite(Texture.WHITE) as TimingBarlineObject
    bar.width = BAR_WIDTH
    bar.height = BAR_HEIGHT
    bar.anchor.set(0.5)
    bar.x = error * 400
    bar.tint = judge.color
    bar.createTime = Date.now()
    bar.miss = isStandardMissTimingWindow(judge)
    bar.ms = Math.round(error * 1000)
    this.errorText.tint = judge.color
    this.errorText.text = (error * 1000).toFixed(1) + "ms"
    this.errorTextTime = Date.now()
    this.barlines.addChild(bar)
    this.target =
      median(
        this.barlines.children
          .filter(child => !child.miss)
          .map(child => child.ms)
      ) * 0.4
  }

  reset() {
    this.currentMedian.x = 0
    this.target = 0
    destroyChildIf(this.barlines.children, () => true)
  }
}
