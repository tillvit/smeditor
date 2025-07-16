import { BitmapText, Container, Graphics, Sprite, Texture } from "pixi.js"
import { assignTint } from "../../../util/Color"
import { clamp, lerp, median } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/PixiUtil"
import { EditMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import {
  TimingWindowCollection,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
} from "../../play/TimingWindowCollection"

interface ErrorBar extends Sprite {
  createTime: number
  ms: number
  miss: boolean
}

interface ErrorBarlineContainer extends Container {
  children: ErrorBar[]
}

const BAR_WIDTH = 1
const BAR_HEIGHT = 15

const errorStyle = {
  fontName: "Fancy",
  fontSize: 12,
}

export class ErrorBarContainer
  extends Container
  implements ChartRendererComponent
{
  readonly isEditGUI = false
  private barlines: ErrorBarlineContainer =
    new Container() as ErrorBarlineContainer
  private readonly barline: Sprite
  private readonly currentMedian: Graphics
  private errorText: BitmapText = new BitmapText("", errorStyle)
  private errorTextTime = -1
  private renderer: ChartRenderer
  private target = 0

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.barline = new Sprite(Texture.WHITE)
    this.barline.anchor.set(0.5)
    this.barline.height = 1
    this.barline.alpha = 0.5
    assignTint(this.barline, "text-color")
    const target = new Sprite(Texture.WHITE)
    target.width = 2
    target.height = BAR_HEIGHT
    target.anchor.set(0.5)
    assignTint(target, "text-color")
    this.currentMedian = new Graphics()
    this.currentMedian.beginFill(0xffffff)
    this.currentMedian.moveTo(0, -10)
    this.currentMedian.lineTo(5, -15)
    this.currentMedian.lineTo(-5, -15)
    this.currentMedian.lineTo(0, -10)
    assignTint(this.currentMedian, "text-color")
    this.errorText.y = -25
    this.errorText.anchor.set(0.5)
    this.addChild(
      this.barline,
      target,
      this.barlines,
      this.currentMedian,
      this.errorText
    )
  }

  update() {
    this.y = Options.chart.reverse ? -10 : 10
    this.errorText.y = Options.chart.reverse ? 25 : -25
    this.visible = this.renderer.chartManager.getMode() == EditMode.Play
    for (const barline of this.barlines.children) {
      const t = (Date.now() - barline.createTime) / 5000
      if (t < 0.05) barline.alpha = 1
      else if (t < 0.3) barline.alpha = lerp(1, 0.2, (t - 0.05) / 0.25)
      else if (t < 0.9) barline.alpha = 0.2
      else barline.alpha = (1 - t) * 3
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
  }

  addBar(error: number | null, judge: TimingWindow) {
    if (error == null) return
    if (!isStandardMissTimingWindow(judge) && !isStandardTimingWindow(judge))
      return
    const bar = new Sprite(Texture.WHITE) as ErrorBar
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
