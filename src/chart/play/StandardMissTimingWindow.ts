import { JudgmentTexture } from "./JudgmentTexture"
import { StandardTimingWindow } from "./StandardTimingWindow"

export class StandardMissTimingWindow extends StandardTimingWindow {
  constructor(
    name: string,
    color: number,
    dancePoints: number,
    lifeChange: number,
    judgmentTexture: JudgmentTexture
  ) {
    super("miss", name, color, 0, dancePoints, lifeChange, judgmentTexture)
  }
}
