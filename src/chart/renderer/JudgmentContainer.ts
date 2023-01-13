import { Sprite } from "pixi.js"
import { Options } from "../../util/Options"
import { clamp } from "../../util/Util"
import {
  StandardTimingWindow,
  TIMING_WINDOW_AUTOPLAY,
} from "../play/StandardTimingWindow"
import { TimingWindow } from "../play/TimingWindow"
import {
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "../play/TimingWindowCollection"

export class JudgmentContainer extends Sprite {
  private createTime = -1
  private active = false
  private type: StandardTimingWindow = TIMING_WINDOW_AUTOPLAY

  constructor() {
    super()
    this.y = -40
    this.anchor.set(0.5)
  }

  renderThis() {
    this.visible = this.active
    if (this.active) {
      const time = (Date.now() - this.createTime) / 1000
      let zoom = 1.1
      if (
        !TimingWindowCollection.getCollection(
          Options.play.timingCollection
        ).shouldHideNote(this.type)
      )
        zoom = 0.5
      if (time < 0.1) {
        const p = 1 - (1 - time / 0.1) * (1 - time / 0.1)
        const z = (1 - zoom) * p + zoom
        this.scale.x = 0.4 * z
        this.scale.y = 0.4 * z * (Options.chart.reverse ? -1 : 1)
      } else if (time > 0.6 && time < 0.8) {
        const p = (((time - 0.6) / 0.2) * (time - 0.6)) / 0.2
        this.scale.x = 0.4 * (1 - p)
        this.scale.y = 0.4 * (1 - p) * (Options.chart.reverse ? -1 : 1)
      } else if (time > 0.8) {
        this.active = false
      }
    }
  }

  doJudge(error: number, judgment: TimingWindow) {
    if (
      !isStandardTimingWindow(judgment) &&
      !isStandardMissTimingWindow(judgment)
    )
      return
    const tex = judgment.judgmentTexture.getTexture(error, judgment)
    if (!tex) return
    this.texture = tex
    this.texture.updateUvs()
    this.active = true
    this.type = judgment
    this.createTime = Date.now()
    if (Options.play.judgmentTilt)
      this.rotation = ((clamp(error, -0.05, 0.05) * 300) / 180) * Math.PI
    else this.rotation = 0
  }

  reset() {
    this.active = false
  }
}
