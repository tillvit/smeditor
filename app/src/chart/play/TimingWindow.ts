import { Options } from "../../util/Options"

export abstract class TimingWindow {
  timingWindowMS: number
  dancePoints: number
  lifeChange: number

  protected constructor(
    timingWindowMS: number,
    dancePoints: number,
    lifeChange: number
  ) {
    this.timingWindowMS = timingWindowMS
    this.dancePoints = dancePoints
    this.lifeChange = lifeChange
  }

  /**
   * Returns the calculated milliseconds to achieve this timing window.
   * Includes options timingWindowScale and timingWindowAdd.
   *
   * @return {*}
   * @memberof TimingWindow
   */
  getTimingWindowMS(): number {
    return (
      this.timingWindowMS * Options.play.timingWindowScale +
      Options.play.timingWindowAdd
    )
  }
}
