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
