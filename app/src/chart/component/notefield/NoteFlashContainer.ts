import { Container } from "pixi.js"
import { NoteFlash } from "../../gameTypes/base/Noteskin"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
} from "../../play/TimingWindowCollection"
import { Notefield } from "./Notefield"

interface ColumnNoteFlashes extends Container {
  flashes: Container<NoteFlash>
  holdFlashes: Container<NoteFlash>
}

export class NoteFlashContainer extends Container {
  private readonly notefield
  readonly children: ColumnNoteFlashes[] = []

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield

    for (let colNum = 0; colNum < this.notefield.gameType.numCols; colNum++) {
      const container: ColumnNoteFlashes = new Container() as ColumnNoteFlashes
      container.rotation = this.notefield.getColumnRotation(colNum)
      container.x = this.notefield.getColumnX(colNum)

      const flashes = new Container<NoteFlash>()
      const holdFlashes = new Container<NoteFlash>()
      container.addChild(flashes, holdFlashes)
      container.flashes = flashes
      container.holdFlashes = holdFlashes
      this.addChild(container)
    }
  }

  update(): void {
    this.y = this.notefield.renderer.getActualReceptorYPos()
    this.children.forEach(column => {
      column.flashes.children.forEach(flash =>
        flash.update(this.notefield.renderer)
      )
      column.holdFlashes.children.forEach(flash =>
        flash.update(this.notefield.renderer)
      )
    })
  }
  createNoteFlash(col: number, judge: TimingWindow): void {
    if (isHoldTimingWindow(judge) || isHoldDroppedTimingWindow(judge)) {
      this.children[col].holdFlashes.removeChildren()
    }
    const holdJudgment = this.notefield.noteskin.createNoteFlash(judge)
    if (!holdJudgment) return
    this.children[col].flashes.addChild(holdJudgment)
  }
  createHoldNoteFlash(col: number): void {
    const holdJudgment = this.notefield.noteskin.createHoldNoteFlash()
    if (!holdJudgment) return
    this.children[col].holdFlashes.addChild(holdJudgment)
  }

  reset() {
    this.children.forEach(column => {
      column.flashes.removeChildren()
      column.holdFlashes.removeChildren()
    })
  }
}
