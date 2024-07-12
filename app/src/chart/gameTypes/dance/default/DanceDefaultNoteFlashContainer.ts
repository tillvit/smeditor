import { BLEND_MODES, Sprite, Texture } from "pixi.js"
import { TimingWindow } from "../../../play/TimingWindow"
import {
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardTimingWindow,
} from "../../../play/TimingWindowCollection"

import flashW4Url from "../../../../../assets/noteskin/dance/default/flash/decent.png"
import flashW2Url from "../../../../../assets/noteskin/dance/default/flash/excellent.png"
import flashW0Url from "../../../../../assets/noteskin/dance/default/flash/fantastic.png"
import flashW3Url from "../../../../../assets/noteskin/dance/default/flash/great.png"
import holdFlashUrl from "../../../../../assets/noteskin/dance/default/flash/hold.png"
import flashMineUrl from "../../../../../assets/noteskin/dance/default/flash/mine.png"
import flashW5Url from "../../../../../assets/noteskin/dance/default/flash/way_off.png"
import flashW1Url from "../../../../../assets/noteskin/dance/default/flash/white_fantastic.png"
import { NoteFlash } from "../../base/Noteskin"
import { rotationMap } from "./DanceDefaultNoteskin"

const HOLD_TEX = Texture.from(holdFlashUrl)

const FLASH_TEX_MAP: Record<string, Texture> = {
  w0: Texture.from(flashW0Url),
  w1: Texture.from(flashW1Url),
  w2: Texture.from(flashW2Url),
  w3: Texture.from(flashW3Url),
  w4: Texture.from(flashW4Url),
  w5: Texture.from(flashW5Url),
  mine: Texture.from(flashMineUrl),
}

export class DanceDefaultNoteFlash extends Sprite implements NoteFlash {
  private createTime = 0
  private type = "flash"

  constructor(tex: Texture) {
    super(tex)
    this.anchor.set(0.5)
    this.createTime = Date.now()
  }

  update() {
    switch (this.type) {
      case "flash": {
        const t = (Date.now() - this.createTime) / 150
        this.scale.set(1.1 - t * 0.1)
        this.alpha = 1.2 - t * 1.2
        break
      }
      case "mine": {
        const t2 = (Date.now() - this.createTime) / 600
        this.rotation = t2 * -Math.PI
        this.alpha = Math.min(1, 2 - 2 * t2)
        break
      }
      case "hold":
        this.alpha = Math.sin(Date.now()) * 0.2 + 1.2
    }
    if (Date.now() - this.createTime > 150 && this.type == "flash") {
      this.destroy()
    }
    if (Date.now() - this.createTime > 600 && this.type == "mine") {
      this.destroy()
    }
  }

  static createJudgment(judgment: TimingWindow, columnName: string) {
    let tex: Texture | undefined
    if (isStandardTimingWindow(judgment)) tex = FLASH_TEX_MAP[judgment.id]
    if (isMineTimingWindow(judgment)) tex = FLASH_TEX_MAP["mine"]
    if (isHoldTimingWindow(judgment)) tex = FLASH_TEX_MAP["w2"]
    if (!tex) return
    const flash = new DanceDefaultNoteFlash(tex)
    flash.type = "flash"
    flash.rotation = rotationMap[columnName]
    if (isMineTimingWindow(judgment)) {
      flash.type = "mine"
      flash.blendMode = BLEND_MODES.ADD
    }
    return flash
  }

  static createHoldJudgment(columnName: string) {
    const flash = new DanceDefaultNoteFlash(HOLD_TEX)
    flash.rotation = rotationMap[columnName]
    flash.type = "hold"
    return flash
  }
}
