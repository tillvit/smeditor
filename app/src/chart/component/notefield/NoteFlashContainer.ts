import { Container } from "pixi.js"

import { NoteSkinSprite } from "../../gameTypes/noteskin/Noteskin"
import { Notefield } from "./Notefield"

export class NoteFlashContainer extends Container {
  private readonly notefield
  readonly children: NoteSkinSprite[] = []

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield

    for (let colNum = 0; colNum < this.notefield.gameType.numCols; colNum++) {
      const noteflash = this.notefield.getElement({
        element: "NoteFlash",
        columnName: this.notefield.getColumnName(colNum),
        columnNumber: colNum,
      })
      noteflash.x = this.notefield.getColumnX(colNum)
      this.addChild(noteflash)
    }
  }

  update(): void {
    this.y = this.notefield.renderer.getActualReceptorYPos()
  }
}
