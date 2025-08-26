import { Assets, Rectangle, Texture } from "pixi.js"
import { StandardTimingWindow } from "./StandardTimingWindow"

import judgementITGUrl from "../../../assets/judgement/judgementITG.png"
import judgementPumpUrl from "../../../assets/judgement/judgementPump.png"
import judgementWaterfallUrl from "../../../assets/judgement/judgementWaterfall.png"

export class JudgementTexture {
  static ITG = new JudgementTexture(judgementITGUrl, [
    "w0",
    "w1",
    "w2",
    "w3",
    "w4",
    "w5",
    "miss",
  ])
  static WATERFALL = new JudgementTexture(judgementWaterfallUrl, [
    "w0",
    "w1",
    "w2",
    "w3",
    "w4",
    "w5",
    "miss",
  ])
  static PUMP = new JudgementTexture(
    judgementPumpUrl,
    ["w0", "w3", "w4", "w5", "miss"],
    false
  )

  private texHeight = 0
  private texWidth = 0
  private texture?: Texture
  private judgeNames: string[] = []
  private earlyLate: boolean
  private path: string

  constructor(path: string, judgeNames: string[], earlyLate = true) {
    this.judgeNames = judgeNames
    this.earlyLate = earlyLate
    this.path = path
  }

  private async loadTex() {
    const judge_tex = await Assets.load(this.path)
    this.texture = judge_tex
    this.texHeight = judge_tex.height
    this.texWidth = judge_tex.width
  }

  async getTexture(
    error: number,
    judgment: StandardTimingWindow
  ): Promise<Texture | undefined> {
    if (!this.texture) {
      await this.loadTex()
    }
    if (!this.texture) return
    if (!this.judgeNames.includes(judgment.id)) return
    let tex_coord_x = 0
    const tex_coord_y =
      (this.judgeNames.indexOf(judgment.id) * this.texHeight) /
      this.judgeNames.length
    if (this.earlyLate) {
      if (error >= 0) tex_coord_x += this.texWidth / 2
      this.texture.frame = new Rectangle(
        tex_coord_x,
        tex_coord_y,
        this.texWidth / 2,
        this.texHeight / this.judgeNames.length
      )
    } else {
      this.texture.frame = new Rectangle(
        tex_coord_x,
        tex_coord_y,
        this.texWidth,
        this.texHeight / this.judgeNames.length
      )
    }
    return this.texture
  }
}
