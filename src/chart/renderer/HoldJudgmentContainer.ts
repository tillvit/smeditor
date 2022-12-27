import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { HoldTimingWindow } from "../play/HoldTimingWindow"


interface HoldJudgmentObject extends Sprite {
  createTime: number,
}

export class HoldJudgmentContainer extends Container {

  children: HoldJudgmentObject[] = []

  private held_tex?: Texture
  private dropped_tex?: Texture

  constructor() {
    super()
    this.loadTex()
  }

  async loadTex() {
    let tHeight = 0
    let tWidth = 0
    const judge_tex = await Assets.load('assets/noteskin/hold_judgment.png')
    tHeight = judge_tex.height
    tWidth = judge_tex.width
    this.held_tex = new Texture(judge_tex, new Rectangle(0, 0, tWidth, tHeight/2))
    this.dropped_tex = new Texture(judge_tex, new Rectangle(0, tHeight/2, tWidth, tHeight/2))
  }

  renderThis() {
    this.y = Options.chart.receptorYPos + 48

    for (let child of this.children) { 
      let time = (Date.now() - child.createTime)/1000
      if (time < 0.1) {
        let p = 1 - (1 - time/0.1) * (1 - time/0.1)
        child.scale.set(0.3*p)
      }else if (time > 0.6 && time < 0.8) {
        let p = (time-0.6)/0.2 * (time-0.6)/0.2
        child.scale.set(0.3*(1-p))
      }
    }
    this.children.filter(child => Date.now() - child.createTime > 800).forEach(child => this.removeChild(child))  
  }

  addJudge(col: number, judgment: HoldTimingWindow) {
    let judge = new Sprite(judgment.noteType == "Dropped" ? this.dropped_tex : this.held_tex) as HoldJudgmentObject
    judge.anchor.set(0.5)
    judge.x = col*64-96
    judge.createTime = Date.now()
    this.addChild(judge)
  }
}