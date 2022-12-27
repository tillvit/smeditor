
import { Texture } from "pixi.js"
import { TimingWindow } from "./TimingWindow"

export class MineTimingWindow extends TimingWindow {

  constructor(color: number, timingWindowMS: number, dancePoints: number, lifeChange: number, noteFlashTexture?: Texture) {
    super("Mine", color, timingWindowMS, dancePoints, lifeChange, undefined, noteFlashTexture)
  }
}


