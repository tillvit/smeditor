import { Container } from "pixi.js"

import { NoteskinSprite } from "../../gameTypes/noteskin/Noteskin"
import { Notefield } from "./Notefield"

export class ReceptorContainer extends Container {
  private readonly notefield
  readonly children: NoteskinSprite[] = []

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield

    for (let colNum = 0; colNum < this.notefield.gameType.numCols; colNum++) {
      const receptor = this.notefield.getElement({
        element: "Receptor",
        columnName: this.notefield.getColumnName(colNum),
        columnNumber: colNum,
      })
      receptor.x = this.notefield.getColumnX(colNum)
      this.addChild(receptor)
    }
  }

  update(): void {
    this.y = this.notefield.renderer.getActualReceptorYPos()
  }
}
