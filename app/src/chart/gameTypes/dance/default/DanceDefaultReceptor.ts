import { Sprite } from "pixi.js"

import { rgbtoHex } from "../../../../util/Color"
import { ChartRenderer } from "../../../ChartRenderer"
import { Receptor } from "../../base/Noteskin"

import { DanceDefaultNoteskinObject } from "./DanceDefaultNoteskin"

export class DanceDefaultReceptor extends Sprite implements Receptor {
  private lastPressedTime = -1
  private pressedKeys = 0

  constructor(noteskin: DanceDefaultNoteskinObject) {
    super(noteskin.textures["Receptor"])
    this.width = 69
    this.height = 69
    this.anchor.set(0.5)
  }

  update(_renderer: ChartRenderer, beat: number) {
    const col =
      Math.min(
        1,
        Math.max(1 - ((beat + 100000) % 1), 0.5 + (this.pressedKeys ? 0.2 : 0))
      ) * 255
    let scale = 1
    if (Date.now() - this.lastPressedTime < 110)
      scale = ((Date.now() - this.lastPressedTime) / 110) * 0.25 + 0.75
    this.scale.set(scale * 0.5)
    this.tint = rgbtoHex(col, col, col)
  }

  keyDown() {
    const wasPressed = this.pressedKeys++
    if (!wasPressed) this.lastPressedTime = Date.now()
  }

  keyUp() {
    this.pressedKeys = Math.max(this.pressedKeys - 1, 0)
  }
}
