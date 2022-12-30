
import { TimingWindow } from "./TimingWindow"

export class MineTimingWindow extends TimingWindow {

  readonly target = "mine"

  constructor(timingWindowMS: number, dancePoints: number, lifeChange: number) {
    super(timingWindowMS, dancePoints, lifeChange)
  }
}


