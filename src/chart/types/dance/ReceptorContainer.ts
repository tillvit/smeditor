import { Container, Sprite, Texture } from "pixi.js"
import { ColHeldTracker } from "../../../util/ColHeldTracker"
import { Options } from "../../../util/Options"
import { rgbtoHex } from "../../../util/Util"
import { DanceNotefield } from "./DanceNotefield"

const receptor_tex = Texture.from("assets/noteskin/dance/receptor.png")

interface Receptor extends Sprite {
  lastPressedTime: number
  pressed: boolean
}

export class ReceptorContainer extends Container {
  private notefield: DanceNotefield
  private receptors: Container = new Container()
  private pressedCols: ColHeldTracker = new ColHeldTracker()

  children: Sprite[] = []

  constructor(notefield: DanceNotefield) {
    super()
    this.notefield = notefield
    for (let i = 0; i < this.notefield.getNumCols(); i++) {
      const receptor = new Sprite(receptor_tex) as Receptor
      receptor.width = 69
      receptor.height = 69
      receptor.anchor.set(0.5)
      receptor.x = this.notefield.getColX(i)
      receptor.rotation = this.notefield.getRotFromCol(i)
      receptor.lastPressedTime = -1
      receptor.pressed = false
      this.receptors.addChild(receptor)
    }

    this.addChild(this.receptors)
  }

  renderThis(beat: number) {
    this.y = Options.chart.receptorYPos

    for (const child of this.receptors.children) {
      const receptor = child as Receptor
      const col =
        Math.min(
          1,
          Math.max(
            1 - ((beat + 100000) % 1),
            0.5 + (receptor.pressed ? 0.1 : 0)
          )
        ) * 255
      let scale = 1
      if (Date.now() - receptor.lastPressedTime < 110)
        scale = ((Date.now() - receptor.lastPressedTime) / 110) * 0.25 + 0.75
      receptor.scale.set(scale * 0.5)
      receptor.tint = rgbtoHex(col, col, col)
    }
  }

  keyDown(col: number) {
    const wasPressed = this.pressedCols.isPressed(col)
    this.pressedCols.keyDown(col)
    const receptor = this.receptors.children[col] as Receptor
    receptor.pressed = true
    if (!wasPressed) receptor.lastPressedTime = Date.now()
  }

  keyUp(col: number) {
    this.pressedCols.keyUp(col)
    const receptor = this.receptors.children[col] as Receptor
    receptor.pressed = this.pressedCols.isPressed(col)
  }
}
