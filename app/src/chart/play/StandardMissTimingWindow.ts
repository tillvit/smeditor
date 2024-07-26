import { JudgementTexture } from "./JudgementTexture"
import { StandardTimingWindow } from "./StandardTimingWindow"

export class StandardMissTimingWindow extends StandardTimingWindow {
  constructor(
    name: string,
    color: number,
    dancePoints: number,
    lifeChange: number,
    judgementTexture: JudgementTexture
  ) {
    super("miss", name, color, 0, dancePoints, lifeChange, judgementTexture)
  }
}
