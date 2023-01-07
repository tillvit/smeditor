import { JudgmentTexture } from "../renderer/JudgmentTexture"
import { TimingWindow } from "./TimingWindow"

export class StandardTimingWindow extends TimingWindow {
  id: string
  name: string
  color: number
  judgmentTexture: JudgmentTexture

  constructor(
    id: string,
    name: string,
    color: number,
    timingWindowMS: number,
    dancePoints: number,
    lifeChange: number,
    judgmentTexture: JudgmentTexture
  ) {
    super(timingWindowMS, dancePoints, lifeChange)
    this.id = id
    this.name = name
    this.color = color
    this.judgmentTexture = judgmentTexture
  }
}

export const TIMING_WINDOW_AUTOPLAY = new StandardTimingWindow(
  "w0",
  "Fantastic",
  0x2cce8,
  0,
  0,
  0,
  JudgmentTexture.ITG
)
