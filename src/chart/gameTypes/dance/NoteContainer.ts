import { Container } from "pixi.js"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/Util"
import { EditMode } from "../../ChartManager"
import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"
import { DanceNoteTexture } from "./DanceNoteTexture"

interface ExtendedNoteObject extends NoteObject {
  note: NotedataEntry
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

export class NoteContainer extends Container {
  children: ExtendedNoteObject[] = []

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private noteMap: Map<NotedataEntry, ExtendedNoteObject> = new Map()

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.notefield = notefield
    this.sortableChildren = true
    const timeSig = () => {
      this.children.forEach(child =>
        DanceNoteRenderer.setData(
          this.notefield,
          child,
          child.note,
          this.renderer.chart.timingData
        )
      )
    }
    EventHandler.on("timeSigChanged", timeSig)
    this.on("destroyed", () => [EventHandler.off("timeSigChanged", timeSig)])
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {
    //Reset mark of old objects
    this.children.forEach(child => (child.marked = false))
    const time = this.renderer.chartManager.getTime()
    for (const note of this.renderer.chart.getNotedata()) {
      if (note.gameplay?.hideNote) continue
      if (Options.chart.CMod && Options.chart.hideWarpedArrows && note.warped)
        continue
      if (note.beat + (isHoldNote(note) ? note.hold : 0) < fromBeat) continue
      if (note.beat > toBeat) break

      const [outOfBounds, endSearch, yPos, holdLength] = this.checkBounds(
        note,
        beat
      )
      if (endSearch) break
      if (outOfBounds) continue

      const arrow = this.getNote(note)
      arrow.deactivated = false
      arrow.marked = true
      arrow.dirtyTime = Date.now()
      arrow.y = yPos
      arrow.item.scale.y = Options.chart.reverse ? -1 : 1
      if (isHoldNote(note)) {
        DanceNoteRenderer.setHoldLength(arrow, holdLength)
        if (note.gameplay?.lastHoldActivation) {
          let t =
            (Date.now() - note.gameplay.lastHoldActivation) /
            TimingWindowCollection.getCollection(Options.play.timingCollection)
              .getHeldJudgement(note)
              .getTimingWindowMS()
          t = Math.min(1.2, t)
          DanceNoteRenderer.setHoldBrightness(arrow, 1 - t * 0.7)
        } else {
          DanceNoteRenderer.setHoldBrightness(arrow, 0.8)
        }
      }
      if (note.type == "Fake") {
        DanceNoteRenderer.hideFakeIcon(
          arrow,
          this.renderer.chartManager.getMode() == EditMode.Play
        )
      }
      const inSelection =
        this.renderer.chartManager.getMode() != EditMode.Play &&
        (this.renderer.chartManager.selection.notes.includes(note) ||
          this.renderer.chartManager.selection.inProgressNotes.includes(note))
      arrow.selection.alpha = inSelection
        ? Math.sin(Date.now() / 320) * 0.1 + 0.3
        : 0
      const inSelectionBounds = this.renderer.selectionTest(arrow)
      if (!inSelection && inSelectionBounds) {
        this.renderer.chartManager.addNoteToDragSelection(note)
      }
      if (inSelection && !inSelectionBounds) {
        this.renderer.chartManager.removeNoteFromDragSelection(note)
      }
      if (this.renderer.chartManager.selection.shift && inSelection) {
        arrow.visible = false
      } else {
        arrow.visible = true
      }
    }

    DanceNoteTexture.setArrowTexTime(beat, time)

    //Remove old elements

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
    let y = Options.chart.receptorYPos / Options.chart.zoom
    if (
      !isHoldNote(note) ||
      !note.gameplay?.lastHoldActivation ||
      beat < note.beat
    )
      y = this.renderer.getYPos(note.beat)
    if (isHoldNote(note) && note.gameplay?.droppedHoldBeat)
      y = this.renderer.getYPos(note.gameplay.droppedHoldBeat)
    const y_hold = this.renderer.getYPos(
      note.beat + (isHoldNote(note) ? note.hold : 0)
    )
    if (
      isHoldNote(note) &&
      !note.gameplay?.droppedHoldBeat &&
      note.gameplay?.lastHoldActivation &&
      note.beat + note.hold < beat
    )
      return [true, false, y, y_hold - y]
    if (y_hold < this.renderer.getUpperBound())
      return [true, false, y, y_hold - y]
    if (y > this.renderer.getLowerBound()) {
      if (note.beat < beat || this.renderer.isNegScroll(note.beat))
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
      newChild.zIndex = note.beat
      this.addChild(newChild as ExtendedNoteObject)
    }
    newChild.note = note
    newChild.visible = true
    newChild.zIndex = note.beat
    DanceNoteRenderer.setData(
      this.notefield,
      newChild as ExtendedNoteObject,
      note,
      this.renderer.chart.timingData
    )
    newChild.x = this.notefield.getColX(note.col)
    this.renderer.registerDragNote(newChild as ExtendedNoteObject)
    this.noteMap.set(note, newChild as ExtendedNoteObject)
    return newChild as ExtendedNoteObject
  }
}
