import { JudgementTexture } from "./JudgementTexture"
import { TimingWindow } from "./TimingWindow"

export class StandardTimingWindow extends TimingWindow {
  id: string
  name: string
  color: number
  judgementTexture: JudgementTexture

  constructor(
    id: string,
    name: string,
    color: number,
    timingWindowMS: number,
    dancePoints: number,
    lifeChange: number,
    judgementTexture: JudgementTexture
  ) {
    super(timingWindowMS, dancePoints, lifeChange)
    this.id = id
    this.name = name
    this.color = color
    this.judgementTexture = judgementTexture
  }
}

export const TIMING_WINDOW_AUTOPLAY = new StandardTimingWindow(
  "w0",
  "Fantastic",
  0x2cce8,
  0,
  0,
  0,
  JudgementTexture.ITG
)
