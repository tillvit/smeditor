import { Container } from "pixi.js"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { Options } from "../../../util/Options"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"

export class SelectionNoteContainer extends Container {
  private readonly notefield: DanceNotefield
  private arrowMap: Map<NotedataEntry, NoteObject> = new Map()
  private arrowPool = new DisplayObjectPool({
    create: () => DanceNoteRenderer.createArrow(),
  })

  private lastBeatShift = 0
  private lastColShift = 0

  constructor(notefield: DanceNotefield) {
    super()
    this.notefield = notefield
    this.arrowPool.sortableChildren = true
    this.addChild(this.arrowPool)
  }

  update(fromBeat: number, toBeat: number) {
    if (!this.notefield.getRenderer().chartManager.selection.shift) {
      this.arrowPool.destroyAll()
      this.arrowMap.clear()
      return
    }
    const beatShift =
      this.notefield.getRenderer().chartManager.selection.shift!.beatShift
    const columnShift =
      this.notefield.getRenderer().chartManager.selection.shift!.columnShift

    if (this.lastBeatShift != beatShift || this.lastColShift != columnShift) {
      this.lastBeatShift = beatShift
      this.lastColShift = columnShift
      for (const [note, arrow] of this.arrowMap.entries()) {
        DanceNoteRenderer.setData(
          this.notefield,
          arrow,
          {
            beat: note.beat + beatShift,
            col: note.col + columnShift,
            type: note.type,
          },
          this.notefield.getRenderer().chart.timingData
        )
        arrow.x = this.notefield.getColX(note.col + columnShift)
      }
    }

    for (const note of this.notefield.getRenderer().chartManager.selection
      .notes) {
      if (note.beat + beatShift + (isHoldNote(note) ? note.hold : 0) < fromBeat)
        continue
      if (note.beat + beatShift > toBeat) continue

      if (!this.arrowMap.has(note)) {
        const arrow = this.arrowPool.createChild()
        if (!arrow) continue
        arrow.x = this.notefield.getColX(note.col + columnShift)
        arrow.zIndex = note.beat
        arrow.alpha = 0.4
        DanceNoteRenderer.setData(
          this.notefield,
          arrow,
          {
            beat: note.beat + beatShift,
            col: note.col + columnShift,
            type: note.type,
          },
          this.notefield.getRenderer().chart.timingData
        )

        this.arrowMap.set(note, arrow)
      }
    }

    for (const [note, arrow] of this.arrowMap.entries()) {
      if (
        note.beat + beatShift + (isHoldNote(note) ? note.hold : 0) < fromBeat ||
        note.beat + beatShift > toBeat
      ) {
        this.arrowPool.destroyChild(arrow)
        this.arrowMap.delete(note)
        continue
      }
      const newBeat = note.beat + beatShift
      arrow.y = this.notefield.getRenderer().getYPosFromBeat(newBeat)
      arrow.selection.alpha = Math.sin(Date.now() / 320) * 0.1 + 0.3
      arrow.item.scale.y = Options.chart.reverse ? -1 : 1
      if (isHoldNote(note)) {
        const holdLength =
          this.notefield
            .getRenderer()
            .getYPosFromBeat(newBeat + (isHoldNote(note) ? note.hold : 0)) -
          arrow.y
        DanceNoteRenderer.setHoldLength(arrow, holdLength)
        DanceNoteRenderer.setHoldBrightness(arrow, 0.8)
      }
    }
  }
}
