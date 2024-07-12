import { Sprite, Texture } from "pixi.js"

import { ChartRenderer } from "../../../ChartRenderer"
import { Receptor } from "../../base/Noteskin"

import tapCenterUrl from "../../../../../assets/noteskin/pump/default/centerReceptor.png"
import tapDownLeftUrl from "../../../../../assets/noteskin/pump/default/downLeftReceptor.png"
import { rgbtoHex } from "../../../../util/Color"
import { rotationMap } from "./PumpDefaultNoteskin"

const dlReceptorTex = Texture.from(tapDownLeftUrl)
const cenReceptorTex = Texture.from(tapCenterUrl)

export class PumpDefaultReceptor extends Sprite implements Receptor {
  private lastPressedTime = -1
  private pressedKeys = 0

  constructor(columnName: string) {
    super(columnName == "Center" ? cenReceptorTex : dlReceptorTex)

    this.anchor.set(0.5)
    this.width = 72
    this.height = 72
    this.rotation = (rotationMap[columnName] * Math.PI) / 180
    this.alpha = 0.8
  }

  update(_renderer: ChartRenderer, beat: number) {
    // const col =
    //   Math.min(
    //     1,
    //     Math.max(1 - ((beat + 100000) % 1), 0.5 + (this.pressedKeys ? 0.2 : 0))
    //   ) * 255
    let scale = 1
    if (Date.now() - this.lastPressedTime < 110)
      scale = ((Date.now() - this.lastPressedTime) / 110) * 0.25 + 0.75
    this.scale.set((scale * 72) / 128)
    let brightness = 204
    if (beat % 1 > 0.2) brightness = 102
    this.tint = rgbtoHex(brightness, brightness, brightness)
  }

  keyDown() {
    const wasPressed = this.pressedKeys++
    if (!wasPressed) this.lastPressedTime = Date.now()
  }

  keyUp() {
    this.pressedKeys = Math.max(this.pressedKeys - 1, 0)
  }
}
