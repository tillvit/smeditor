import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js"
import holdJudgmentUrl from "../../../../assets/judgment/hold_judgment.png"
import { destroyChildIf } from "../../../util/Util"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
} from "../../play/TimingWindowCollection"

import { Options } from "../../../util/Options"
import { Notefield } from "./Notefield"

interface HoldJudgmentObject extends Sprite {
  createTime: number
}

export class HoldJudgmentContainer extends Container {
  children: HoldJudgmentObject[] = []

  private static held_tex?: Texture
  private static dropped_tex?: Texture

  private readonly notefield: Notefield

  constructor(notefield: Notefield) {
    super()
    if (!HoldJudgmentContainer.held_tex) this.loadTex()
    this.notefield = notefield
  }

  async loadTex() {
    const judgeTex: Texture = await Assets.load(holdJudgmentUrl)
    const tHeight = judgeTex.height
    const tWidth = judgeTex.width
    HoldJudgmentContainer.held_tex = new Texture({
      source: judgeTex.source,
      frame: new Rectangle(0, 0, tWidth, tHeight / 2),
    })
    HoldJudgmentContainer.dropped_tex = new Texture({
      source: judgeTex.source,
      frame: new Rectangle(0, tHeight / 2, tWidth, tHeight / 2),
    })
  }

  update() {
    this.y =
      this.notefield.renderer.getActualReceptorYPos() +
      (Options.chart.reverse ? -48 : 48)

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
    judge.x = this.notefield.getColumnX(col)
    judge.createTime = Date.now()
    judge.scale.set(0)
    this.addChild(judge)
  }
}
