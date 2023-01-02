import { Container } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { DanceNoteRenderer } from "./DanceNoteRenderer"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { Options } from "../../../util/Options"
import { EditMode } from "../../ChartManager"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteTexture } from "./DanceNoteTexture"

interface NoteObject extends Container {
  note: NotedataEntry,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number
}

export class NoteContainer extends Container {

  children: NoteObject[] = []

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private noteMap: Map<NotedataEntry, NoteObject> = new Map

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.notefield = notefield
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {

    //Reset mark of old objects
    this.children.forEach(child => child.marked = false)

    let time = this.renderer.chartManager.getTime()
    for (let note of this.renderer.chart.notedata) { 
      if (note.gameplay?.hideNote) continue
      if (Options.chart.CMod && Options.chart.hideWarpedArrows && note.warped) continue
      if (note.beat + (isHoldNote(note) ? note.hold : 0) < fromBeat) continue
      if (note.beat > toBeat) break

      let [outOfBounds, endSearch, yPos, holdLength] = this.checkBounds(note, beat)
      if (endSearch) break
      if (outOfBounds) continue

      let arrow = this.getNote(note)
      arrow.y = yPos;
      if (isHoldNote(note)) {
        DanceNoteRenderer.setHoldLength(arrow, holdLength)
        if (note.gameplay?.lastHoldActivation) {
          let t = (Date.now() - note.gameplay.lastHoldActivation)/Options.play.timingCollection.getHeldJudgement(note).getTimingWindowMS()
          t = Math.min(1.2, t)
          DanceNoteRenderer.setHoldBrightness(arrow, 1-t*0.7)
        }
      }
      if (note.type == "Fake") {
        DanceNoteRenderer.hideFakeOverlay(arrow, this.renderer.chartManager.getMode() == EditMode.Play)
      }
    }

    DanceNoteTexture.setArrowTexTime(beat, time)

    //Remove old elements
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      this.noteMap.delete(child.note)
    })

    this.children.filter(child => Date.now() - child.dirtyTime > 5000).forEach(child => {
      child.destroy()
      this.removeChild(child)
    })
  }

  private checkBounds(note: NotedataEntry, beat: number): [boolean, boolean, number, number] {
    let y = this.renderer.getYPos(beat)
    if (!isHoldNote(note) || (!note.gameplay?.lastHoldActivation || beat < note.beat)) y = this.renderer.getYPos(note.beat)
    if (isHoldNote(note) && note.gameplay?.droppedHoldBeat) y = this.renderer.getYPos(note.gameplay.droppedHoldBeat)
    let y_hold = this.renderer.getYPos(note.beat + (isHoldNote(note) ? note.hold : 0))
    if (isHoldNote(note) && !note.gameplay?.droppedHoldBeat && note.gameplay?.lastHoldActivation && note.beat + note.hold < beat) return [true, false, y, y_hold - y]
    if (y_hold < -32 - this.renderer.y) return [true, false, y, y_hold - y]
    if (y > this.renderer.chartManager.app.renderer.screen.height-this.renderer.y+32) {
      if (this.renderer.isNegScroll() || note.beat < beat) [true, false, y, y_hold - y]
      else [true, true, y, y_hold - y]
    } 
    return [false, false, y, y_hold - y]
  }

  private getNote(note: NotedataEntry): NoteObject {
    if (this.noteMap.get(note)) return this.noteMap.get(note)!
    let newChild: Partial<NoteObject> | undefined
    for (let child of this.children) {
      if (child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) { 
      newChild = DanceNoteRenderer.createArrow() as NoteObject
      this.addChild(newChild as NoteObject)
    }
    newChild.note = note
    newChild.deactivated = false
    newChild.marked = true
    newChild.visible = true
    this.buildObject(newChild)
    return newChild as NoteObject
  }

  private buildObject(noteObj: Partial<NoteObject>) {
    DanceNoteRenderer.setData(this.notefield, noteObj as NoteObject, noteObj.note!)
    noteObj.x = this.notefield.getColX(noteObj.note!.col)
  }
}