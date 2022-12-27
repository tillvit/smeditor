import { Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { JudgmentTexture } from "../renderer/JudgmentTexture"

export class TimingWindow {
  name: string
  color: number
  timingWindowMS: number
  dancePoints: number
  lifeChange: number
  judgmentTexture?: JudgmentTexture
  noteFlashTexture?: Texture

  static AUTOPLAY = new TimingWindow("Fantastic", 0x2cce8, 0, 0, 0, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/fantastic.png'))

  constructor(name: string, color: number, timingWindowMS: number, dancePoints: number, lifeChange: number, judgmentTexture?: JudgmentTexture, noteFlashTexture?: Texture) {
    this.name = name
    this.color = color
    this.timingWindowMS = timingWindowMS
    this.dancePoints = dancePoints
    this.lifeChange = lifeChange
    this.judgmentTexture = judgmentTexture
    this.noteFlashTexture = noteFlashTexture
  }

  getTimingWindowMS(){
    return this.timingWindowMS * Options.play.timingWindowScale + Options.play.timingWindowAdd
  }
}


