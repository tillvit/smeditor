import { Assets, Rectangle, Texture } from "pixi.js"
import { TimingWindow } from "../play/TimingWindow"

export class JudgmentTexture {

  static ITG = new JudgmentTexture('assets/noteskin/judgmentITG.png', ["Fantastic", "White Fantastic", "Excellent", "Great", "Decent", "Way Off", "Miss"])
  static WATERFALL = new JudgmentTexture('assets/noteskin/judgmentWaterfall.png', ["Masterful", "White Masterful", "Awesome", "Solid", "Ok", "Fault", "Miss"])
  
  private tHeight = 0
  private tWidth = 0
  private texture?: Texture
  private judgeNames: string[] = []

  constructor(path: string, judgeNames: string[]) {
    this.judgeNames = judgeNames
    this.loadTex(path)
  }

  private async loadTex(path: string) {
    const judge_tex = await Assets.load(path)
    this.texture = judge_tex
    this.tHeight = judge_tex.height
    this.tWidth = judge_tex.width
  }

  getTexture(error: number, judgment: TimingWindow): Texture | undefined {
    if (!this.judgeNames.includes(judgment.name)) return
    let tex_coord_x = 0
    let tex_coord_y = this.judgeNames.indexOf(judgment.name)*this.tHeight/this.judgeNames.length
    if (error >= 0) tex_coord_x += this.tWidth/2
    this.texture!.frame = new Rectangle(tex_coord_x, tex_coord_y, this.tWidth/2, this.tHeight/this.judgeNames.length)
    return this.texture
  }
}
