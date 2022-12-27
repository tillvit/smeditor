import { Sprite } from "pixi.js"
import { Options } from "../../util/Options"
import { clamp } from "../../util/Util"
import { TimingWindow } from "../play/TimingWindow"

export class JudgmentContainer extends Sprite {

  private createTime: number = -1
  private active: boolean = false
  private type: TimingWindow = TimingWindow.AUTOPLAY

  constructor() {
    super()
    this.y = -40
    this.anchor.set(0.5)
  }

  renderThis() {
    this.visible = this.active
    if (this.active) {
      let time = (Date.now() - this.createTime)/1000
      let zoom = 1.1
      if (!Options.play.timingCollection.shouldHideNote(this.type)) zoom = 0.5
      if (time < 0.1) {
        let p = 1 - (1 - time/0.1) * (1 - time/0.1)
        let z = (1 - zoom) * p + zoom
        this.scale.set(0.4*z)
      }else if (time > 0.6 && time < 0.8) {
        let p = (time-0.6)/0.2 * (time-0.6)/0.2
        this.scale.set(0.4*(1-p))
      }else if (time > 0.8) {
        this.active = false
      }
    }
  }

  doJudge(error: number, judgment: TimingWindow) {
    let tex = judgment.judgmentTexture?.getTexture(error, judgment)
    if (!tex) return
    this.texture = tex
    this.texture.updateUvs()
    this.active = true
    this.type = judgment
    this.createTime = Date.now()
    if (Options.play.judgmentTilt) this.rotation = clamp(error, -0.05, 0.05) * 300/180*Math.PI
    else this.rotation = 0
  }
}