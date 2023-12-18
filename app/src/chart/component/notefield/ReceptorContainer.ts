import { Container } from "pixi.js"
import { Receptor } from "../../gameTypes/base/Noteskin"
import { Notefield } from "./Notefield"

export class ReceptorContainer extends Container {
  private readonly notefield
  readonly children: Receptor[] = []

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield

    for (let colNum = 0; colNum < this.notefield.gameType.numCols; colNum++) {
      const receptor = this.notefield.noteskin.createReceptor(colNum)
      receptor.rotation = this.notefield.getColumnRotation(colNum)
      receptor.x = this.notefield.getColumnX(colNum)
      this.addChild(receptor)
    }
  }

  update(beat: number): void {
    this.y = this.notefield.renderer.getActualReceptorYPos()
    this.children.forEach(receptor =>
      receptor.update(this.notefield.renderer, beat)
    )
  }

  keyDown(col: number): void {
    this.children[col].keyDown()
  }

  keyUp(col: number): void {
    this.children[col].keyUp()
  }
}
