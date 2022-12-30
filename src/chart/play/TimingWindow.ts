import { Options } from "../../util/Options"

export abstract class TimingWindow {

  timingWindowMS: number
  dancePoints: number
  lifeChange: number

  constructor(timingWindowMS: number, dancePoints: number, lifeChange: number) {
    this.timingWindowMS = timingWindowMS
    this.dancePoints = dancePoints
    this.lifeChange = lifeChange
  }

  getTimingWindowMS(){
    return this.timingWindowMS * Options.play.timingWindowScale + Options.play.timingWindowAdd
  }
}


