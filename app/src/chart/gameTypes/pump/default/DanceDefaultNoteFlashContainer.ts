import { BLEND_MODES, Sprite, Texture } from "pixi.js"
import { TimingWindow } from "../../../play/TimingWindow"
import {
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardTimingWindow,
} from "../../../play/TimingWindowCollection"
import { NoteFlash } from "../../base/Noteskin"

import flashUrl from "../../../../../assets/noteskin/pump/default/flash.png"
import mineUrl from "../../../../../assets/noteskin/pump/default/mine.png"
import { rgbtoHex } from "../../../../util/Color"
import { lerp } from "../../../../util/Math"

// const HOLD_TEX = Texture.from(holdFlashUrl)
const FLASH_TEX = Texture.from(flashUrl)
const MINE_TEX = Texture.from(mineUrl)

const FLASH_COLORS: Record<string, number[]> = {
  w1: [1.0, 1.0, 1.0, 1],
  w2: [1.0, 1.0, 0.3, 1],
  w3: [0.0, 1.0, 0.4, 1],
  w4: [0.3, 0.8, 1.0, 1],
  w5: [0.8, 0.0, 0.6, 1],
  held: [1.0, 1.0, 1.0, 1],
}

export class PumpDefaultNoteFlash extends Sprite implements NoteFlash {
  private createTime = 0
  private type = "flash"

  constructor(tex: Texture) {
    super(tex)
    this.anchor.set(0.5)
    this.blendMode = BLEND_MODES.ADD
    this.createTime = Date.now()
    this.width = 128
    this.height = 128

    if (this.type == "mine") {
      this.scale.set(1)
    }
  }

  update() {
    switch (this.type) {
      case "hold":
        this.alpha = 1
        break
      case "flash":
        this.updateState((Date.now() - this.createTime) / 1000)
        break
      case "mine": {
        const t2 = (Date.now() - this.createTime) / 600
        this.rotation = t2 * -Math.PI
        this.alpha = Math.min(1, 2 - 2 * t2)
        break
      }
    }
    if (Date.now() - this.createTime > 120 && this.type == "flash") {
      this.destroy()
    }
    if (Date.now() - this.createTime > 600 && this.type == "mine") {
      this.destroy()
    }
  }

  updateState(t: number) {
    if (t < 0.06) {
      this.alpha = 0.6
      this.scale.set((lerp(1, 1.1, t / 0.06) * 128) / 256)
    } else {
      this.alpha = lerp(0.6, 0, (t - 0.06) / 0.12)
    }
  }

  static createJudgment(judgment: TimingWindow) {
    let tex: Texture | undefined
    if (isStandardTimingWindow(judgment)) tex = FLASH_TEX
    if (isMineTimingWindow(judgment)) tex = MINE_TEX
    if (isHoldTimingWindow(judgment)) tex = FLASH_TEX
    if (!tex) return
    const flash = new PumpDefaultNoteFlash(tex)
    flash.type = "flash"
    if (isMineTimingWindow(judgment)) {
      flash.type = "mine"
    }
    if (isStandardTimingWindow(judgment)) {
      flash.tint = this.getHexColor(judgment.id)
    }
    if (isHoldTimingWindow(judgment)) {
      flash.tint = this.getHexColor("held")
    }
    return flash
  }

  static createHoldJudgment() {
    const flash = new PumpDefaultNoteFlash(FLASH_TEX)
    flash.type = "hold"
    return flash
  }

  static getHexColor(id: string) {
    const col = FLASH_COLORS[id] ?? [1, 1, 1]

    return rgbtoHex(
      Math.round(col[0] * 255),
      Math.round(col[1] * 255),
      Math.round(col[2] * 255)
    )
  }
}
