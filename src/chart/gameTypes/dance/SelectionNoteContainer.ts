import { Container } from "pixi.js"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/Util"
import { ChartRenderer } from "../../ChartRenderer"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"

interface ExtendedNoteObject extends NoteObject {
  note: NotedataEntry
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

export class SelectionNoteContainer extends Container {
  children: ExtendedNoteObject[] = []

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private noteMap: Map<NotedataEntry, ExtendedNoteObject> = new Map()

  private lastColShift = 0
  private lastBeatShift = 0

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.notefield = notefield
    this.sortableChildren = true
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {
    if (!this.renderer.chartManager.selection.shift) {
      destroyChildIf(this.children, () => true)
      this.lastBeatShift = 0
      this.lastColShift = 0
      this.noteMap.clear()
      return
    }
    const beatShift = this.renderer.chartManager.selection.shift.beatShift
    const columnShift = this.renderer.chartManager.selection.shift.columnShift
    if (this.lastBeatShift != beatShift || this.lastColShift != columnShift) {
      this.lastBeatShift = beatShift
      this.lastColShift = columnShift
      this.children.forEach(child => {
        DanceNoteRenderer.setData(
          this.notefield,
          child,
          {
            beat: child.note.beat + beatShift,
            col: child.note.col + columnShift,
            type: child.note.type,
          },
          this.renderer.chart.timingData
        )
        child.x = this.notefield.getColX(child.note.col + columnShift)
      })
    }
    this.visible = true
    this.children.forEach(child => (child.marked = false))
    //Reset mark of old objects
    for (const note of this.renderer.chartManager.selection.notes) {
      if (note.beat + beatShift + (isHoldNote(note) ? note.hold : 0) < fromBeat)
        continue
      if (note.beat + beatShift > toBeat) continue

      const [outOfBounds, endSearch, yPos, holdLength] = this.checkBounds(
        note,
        beat
      )
      if (endSearch) continue
      if (outOfBounds) continue

      const arrow = this.getNote(note)
      arrow.deactivated = false
      arrow.marked = true
      arrow.dirtyTime = Date.now()
      arrow.y = yPos
      arrow.selection.alpha = Math.sin(Date.now() / 320) * 0.1 + 0.3
      arrow.item.scale.y = Options.chart.reverse ? -1 : 1
      if (isHoldNote(note)) {
        DanceNoteRenderer.setHoldLength(arrow, holdLength)
        DanceNoteRenderer.setHoldBrightness(arrow, 0.8)
      }
    }

    this.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        this.noteMap.delete(child.note)
      })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(
    note: NotedataEntry,
    beat: number
  ): [boolean, boolean, number, number] {
    const newBeat =
      note.beat + this.renderer.chartManager.selection.shift!.beatShift
    const y = this.renderer.getYPosFromBeat(newBeat)
    const y_hold = this.renderer.getYPosFromBeat(
      newBeat + (isHoldNote(note) ? note.hold : 0)
    )
    if (y_hold < this.renderer.getUpperBound())
      return [true, false, y, y_hold - y]
    if (y > this.renderer.getLowerBound()) {
      if (newBeat < beat || this.renderer.isNegScroll(newBeat))
        return [true, false, y, y_hold - y]
      else return [true, true, y, y_hold - y]
    }
    return [false, false, y, y_hold - y]
  }

  private getNote(note: NotedataEntry): ExtendedNoteObject {
    if (this.noteMap.get(note)) return this.noteMap.get(note)!
    let newChild: Partial<ExtendedNoteObject> | undefined
    for (const child of this.children) {
      if (child.deactivated) {
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = DanceNoteRenderer.createArrow() as ExtendedNoteObject
    }
    newChild.note = note
    newChild.visible = true
    newChild.zIndex = note.beat
    DanceNoteRenderer.setData(
      this.notefield,
      newChild as ExtendedNoteObject,
      {
        beat: note.beat + this.renderer.chartManager.selection.shift!.beatShift,
        col: note.col + this.renderer.chartManager.selection.shift!.columnShift,
        type: note.type,
      },
      this.renderer.chart.timingData
    )
    newChild.x = this.notefield.getColX(
      note.col + this.renderer.chartManager.selection.shift!.columnShift
    )
    newChild.alpha = 0.4
    newChild.interactive = true
    this.noteMap.set(note, newChild as ExtendedNoteObject)
    this.addChild(newChild as ExtendedNoteObject)
    return newChild as ExtendedNoteObject
  }
}
