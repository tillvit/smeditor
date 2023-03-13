import { Assets, Rectangle, Texture } from "pixi.js"
import { StandardTimingWindow } from "../play/StandardTimingWindow"

export class JudgmentTexture {
  static ITG = new JudgmentTexture("assets/judgment/judgmentITG.png", [
    "w0",
    "w1",
    "w2",
    "w3",
    "w4",
    "w5",
    "miss",
  ])
  static WATERFALL = new JudgmentTexture(
    "assets/judgment/judgmentWaterfall.png",
    ["w0", "w1", "w2", "w3", "w4", "w5", "miss"]
  )

  private tHeight = 0
  private tWidth = 0
  private texture?: Texture
  private judgeNames: string[] = []

  constructor(path: string, judgeNames: string[]) {
    this.judgeNames = judgeNames
    this.loadTex(path)
  }

  private async loadTex(path: string) {
    const judge_tex = (await Assets.load(path)) as Texture
    this.texture = judge_tex
    this.tHeight = judge_tex.height
    this.tWidth = judge_tex.width
  }

  getTexture(
    error: number,
    judgment: StandardTimingWindow
  ): Texture | undefined {
    if (!this.judgeNames.includes(judgment.id)) return
    let tex_coord_x = 0
    const tex_coord_y =
      (this.judgeNames.indexOf(judgment.id) * this.tHeight) /
      this.judgeNames.length
    if (error >= 0) tex_coord_x += this.tWidth / 2
    this.texture!.frame = new Rectangle(
      tex_coord_x,
      tex_coord_y,
      this.tWidth / 2,
      this.tHeight / this.judgeNames.length
    )
    return this.texture
  }
}
