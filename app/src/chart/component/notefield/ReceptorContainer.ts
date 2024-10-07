import { Container, FederatedPointerEvent, Point } from "pixi.js"

import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { NoteskinSprite } from "../../gameTypes/noteskin/Noteskin"
import { Notefield } from "./Notefield"

export class ReceptorContainer extends Container {
  private readonly notefield
  readonly children: NoteskinSprite[] = []

  private dragStart: Point | null = null
  private dragOptionsStart: [number, number] | null = null
  private optionUpdate = (option: string) => {
    if (option != "chart.allowReceptorDrag") return
    this.eventMode = Options.chart.allowReceptorDrag ? "static" : "passive"
  }

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

    const moveHandler = (e: FederatedPointerEvent) => {
      if (!this.dragStart || !this.dragOptionsStart) return
      Options.chart.receptorXPos = Math.round(
        this.dragOptionsStart[0] + e.global.x - this.dragStart.x
      )
      Options.chart.receptorYPos = Math.round(
        this.dragOptionsStart[1] + e.global.y - this.dragStart.y
      )
    }

    const releaseHandler = () => {
      this.notefield.renderer.off("pointermove", moveHandler)
      this.notefield.renderer.off("pointerup", releaseHandler)
    }

    this.on("pointerdown", e => {
      this.dragStart = new Point(e.globalX, e.globalY)
      this.dragOptionsStart = [
        Options.chart.receptorXPos,
        Options.chart.receptorYPos,
      ]
      e.preventDefault()
      e.stopImmediatePropagation()

      this.notefield.renderer.on("pointermove", moveHandler)
      this.notefield.renderer.on("pointerup", releaseHandler)
    })

    EventHandler.on("userOptionUpdated", this.optionUpdate)
    this.optionUpdate("chart.allowReceptorDrag")
  }

  destroy() {
    EventHandler.off("userOptionUpdated", this.optionUpdate)
  }

  update(): void {
    this.y = this.notefield.renderer.getActualReceptorYPos()
  }
}
