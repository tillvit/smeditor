import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/Util"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
} from "../../play/TimingWindowCollection"
import { DanceNotefield } from "./DanceNotefield"

interface HoldJudgmentObject extends Sprite {
  createTime: number
}

export class HoldJudgmentContainer extends Container {
  children: HoldJudgmentObject[] = []

  private static held_tex?: Texture
  private static dropped_tex?: Texture

  private notefield: DanceNotefield

  constructor(notefield: DanceNotefield) {
    super()
    if (!HoldJudgmentContainer.held_tex) this.loadTex()
    this.notefield = notefield
  }

  async loadTex() {
    let tHeight = 0
    let tWidth = 0
    const judge_tex = await Assets.load(
      "assets/noteskin/dance/hold_judgment.png"
    )
    tHeight = judge_tex.height
    tWidth = judge_tex.width
    HoldJudgmentContainer.held_tex = new Texture(
      judge_tex,
      new Rectangle(0, 0, tWidth, tHeight / 2)
    )
    HoldJudgmentContainer.dropped_tex = new Texture(
      judge_tex,
      new Rectangle(0, tHeight / 2, tWidth, tHeight / 2)
    )
  }

  update() {
    this.y = Options.chart.receptorYPos / Options.chart.zoom + 48
    this.scale.y = Options.chart.reverse ? -1 : 1

    for (const child of this.children) {
      const time = (Date.now() - child.createTime) / 1000
      if (time < 0.1) {
        const p = 1 - (1 - time / 0.1) * (1 - time / 0.1)
        child.scale.set(0.3 * p)
      } else if (time > 0.6 && time < 0.8) {
        const p = (((time - 0.6) / 0.2) * (time - 0.6)) / 0.2
        child.scale.set(0.3 * (1 - p))
      }
    }
    destroyChildIf(this.children, child => Date.now() - child.createTime > 800)
  }

  addJudge(col: number, judgment: TimingWindow) {
    if (!isHoldDroppedTimingWindow(judgment) && !isHoldTimingWindow(judgment))
      return
    const judge = new Sprite(
      isHoldDroppedTimingWindow(judgment)
        ? HoldJudgmentContainer.dropped_tex
        : HoldJudgmentContainer.held_tex
    ) as HoldJudgmentObject
    judge.anchor.set(0.5)
    judge.x = this.notefield.getColX(col)
    judge.createTime = Date.now()
    judge.scale.set(0)
    this.addChild(judge)
  }
}
