import { Judgment } from "./Judgment"

export class HoldJudgment {
  name: string
  timingWindowMS: number
  
  static HOLD_HELD = new HoldJudgment("Held", 320)
  static ROLL_HELD = new HoldJudgment("Held", 350)
  static DROPPED = new HoldJudgment("Dropped", 320)

  constructor(name: string, timingWindowMS: number) {
    this.name = name
    this.timingWindowMS = timingWindowMS
  }

  getTimingWindow(){
    return this.timingWindowMS * Judgment.timingWindowScale + Judgment.timingWindowAdd
  }
}


