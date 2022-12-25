import { Assets, Rectangle, Sprite } from "pixi.js"
import { ChartRenderer } from "../ChartRenderer"
import { Judgment } from "../play/Judgment"

let tHeight = 0
let tWidth = 0
const judge_tex = await Assets.load('assets/noteskin/judgment.png')
tHeight = judge_tex.height
tWidth = judge_tex.width

export class JudgmentContainer extends Sprite {

  private renderer: ChartRenderer
  private createTime: number = -1
  private active: boolean = false
  private type: Judgment = Judgment.MISS

  constructor(renderer: ChartRenderer) {
    super(judge_tex)
    this.renderer = renderer
    this.y = -32
    this.anchor.set(0.5)
  }

  renderThis() {
    this.visible = this.active
    if (this.active) {
      let time = (Date.now() - this.createTime)/1000
      let zoom = 0.5
      if (this.type.order < 4) zoom = 1.3
      if (time < 0.1) {
        let p = 1 - (1 - time/0.1) * (1 - time/0.1)
        let z = (1 - zoom) * p + zoom
        this.scale.set(0.5*z)
      }else if (time > 0.6 && time < 0.8) {
        let p = (time-0.6)/0.2 * (time-0.6)/0.2
        this.scale.set(0.5*(1-p))
      }else if (time > 0.8) {
        this.active = false
      }
    }
  }

  doJudge(error: number, judgment: Judgment) {
    if (!this.renderer.options.play.faEnabled && judgment == Judgment.WHITE_FANTASTIC) judgment = Judgment.FANTASTIC
    let tex_coord_x = 0
    let tex_coord_y = judgment.order*tHeight/7
    if (error >= 0) tex_coord_x += tWidth/2
    this.texture.frame = new Rectangle(tex_coord_x, tex_coord_y, tWidth/2, tHeight/7)
    this.texture.updateUvs()
    this.active = true
    this.type = judgment
    this.createTime = Date.now()
  }
}