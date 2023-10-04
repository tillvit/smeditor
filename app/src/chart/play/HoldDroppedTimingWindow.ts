import { TimingWindow } from "./TimingWindow"

export class HoldDroppedTimingWindow extends TimingWindow {
  readonly target = "dropped"

  constructor(dancePoints: number, lifeChange: number) {
    super(0, dancePoints, lifeChange)
  }
}
