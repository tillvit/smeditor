import { TimingWindow } from "./TimingWindow"

export class HoldTimingWindow extends TimingWindow {
  noteType: string

  constructor(
    noteType: string,
    timingWindowMS: number,
    dancePoints: number,
    lifeChange: number
  ) {
    super(timingWindowMS, dancePoints, lifeChange)
    this.noteType = noteType
  }
}

export const TIMING_WINDOW_HELD = new HoldTimingWindow("Hold", 0, 0, 0)
