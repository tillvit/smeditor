import { Sprite } from "pixi.js"
import { clamp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { ChartRendererComponent } from "../../ChartRenderer"
import {
  StandardTimingWindow,
  TIMING_WINDOW_AUTOPLAY,
} from "../../play/StandardTimingWindow"
import { TimingWindow } from "../../play/TimingWindow"
import {
  TimingWindowCollection,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
} from "../../play/TimingWindowCollection"

export class JudgementSprite extends Sprite implements ChartRendererComponent {
  readonly isEditGUI = false
  private createTime = -1
  private active = false
  private type: StandardTimingWindow = TIMING_WINDOW_AUTOPLAY

  constructor() {
    super()
    this.anchor.set(0.5)
  }

  update() {
    this.y = Options.chart.reverse ? 40 : -40
    this.visible = this.active
    if (this.active) {
      const time = (Date.now() - this.createTime) / 1000
      let zoom = 1.2
      if (
        !TimingWindowCollection.getCollection(
          Options.play.timingCollection
        ).shouldHideNote(this.type)
      ) {
        zoom = 0.8
      }
      if (time < 0.1) {
        const p = 1 - (1 - time / 0.1) * (1 - time / 0.1)
        const z = (1 - zoom) * p + zoom
        this.scale.x = 0.4 * z
        this.scale.y = 0.4 * z
      } else if (time > 0.6 && time < 0.8) {
        const p = (((time - 0.6) / 0.2) * (time - 0.6)) / 0.2
        this.scale.x = 0.4 * (1 - p)
        this.scale.y = 0.4 * (1 - p)
      } else if (time > 0.8) {
        this.active = false
      }
    }
  }

  async doJudge(error: number | null, judgment: TimingWindow) {
    if (error == null) error = 0
    if (
      !isStandardTimingWindow(judgment) &&
      !isStandardMissTimingWindow(judgment)
    )
      return
    const tex = await judgment.judgementTexture.getTexture(error, judgment)
    if (!tex) return
    this.texture = tex
    this.texture.updateUvs()
    this.active = true
    this.type = judgment
    this.createTime = Date.now()
    if (Options.play.judgementTilt)
      this.rotation = ((clamp(error, -0.05, 0.05) * 300) / 180) * Math.PI
    else this.rotation = 0
  }

  reset() {
    this.active = false
  }
}
