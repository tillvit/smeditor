import { Sprite, Texture } from "pixi.js"
import { TimingWindow } from "../../../play/TimingWindow"
import {
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardTimingWindow,
} from "../../../play/TimingWindowCollection"

import { NoteFlash } from "../../base/Noteskin"
import { DanceDefaultNoteskinObject } from "./DanceDefaultNoteskin"

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
  }

  static createJudgment(
    noteskin: DanceDefaultNoteskinObject,
    judgment: TimingWindow
  ) {
    let tex: Texture | undefined
    if (isStandardTimingWindow(judgment)) tex = noteskin.textures[judgment.id]
    if (isMineTimingWindow(judgment)) tex = noteskin.textures["mine"]
    if (isHoldTimingWindow(judgment)) tex = noteskin.textures["w2"]
    if (!tex) return
    const flash = new DanceDefaultNoteFlash(tex)
    flash.type = "flash"
    if (isMineTimingWindow(judgment)) {
      flash.type = "mine"
      flash.blendMode = "add"
    }
    return flash
  }

  static createHoldJudgment(noteskin: DanceDefaultNoteskinObject) {
    const flash = new DanceDefaultNoteFlash(noteskin.textures["hold"])
    flash.type = "hold"
    return flash
  }
}
