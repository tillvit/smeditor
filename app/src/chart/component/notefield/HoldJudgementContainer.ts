import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js"
import holdJudgementUrl from "../../../../assets/judgement/hold_judgement.png"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
} from "../../play/TimingWindowCollection"

import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/PixiUtil"
import { Notefield } from "./Notefield"

interface HoldJudgementObject extends Sprite {
  createTime: number
}

export class HoldJudgementContainer extends Container {
  children: HoldJudgementObject[] = []

  private static held_tex?: Texture
  private static dropped_tex?: Texture

  private readonly notefield: Notefield

  constructor(notefield: Notefield) {
    super()
    if (!HoldJudgementContainer.held_tex) this.loadTex()
    this.notefield = notefield
  }

  async loadTex() {
    const judgeTex = await Assets.load(holdJudgementUrl)
    const tHeight = judgeTex.height
    const tWidth = judgeTex.width
    HoldJudgementContainer.held_tex = new Texture(
      judgeTex,
      new Rectangle(0, 0, tWidth, tHeight / 2)
    )
    HoldJudgementContainer.dropped_tex = new Texture(
      judgeTex,
      new Rectangle(0, tHeight / 2, tWidth, tHeight / 2)
    )
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

  addJudge(col: number, judgement: TimingWindow) {
    if (!isHoldDroppedTimingWindow(judgement) && !isHoldTimingWindow(judgement))
      return
    const judge = new Sprite(
      isHoldDroppedTimingWindow(judgement)
        ? HoldJudgementContainer.dropped_tex
        : HoldJudgementContainer.held_tex
    ) as HoldJudgementObject
    judge.anchor.set(0.5)
    judge.x = this.notefield.getColumnX(col)
    judge.createTime = Date.now()
    judge.scale.set(0)
    this.addChild(judge)
  }
}
