import { ChartRenderer } from "../../ChartRenderer"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { Options } from "../../../util/Options"
import { EditMode } from "../../ChartManager"
import { DanceNotefield } from "./DanceNotefield"
import { DanceNoteTexture } from "./DanceNoteTexture"
import { Container } from "pixi.js"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { destroyChildIf } from "../../../util/Util"

interface ExtendedNoteObject extends NoteObject {
  note: NotedataEntry,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number
}

export class NoteContainer extends Container {

  children: ExtendedNoteObject[] = []

  private notefield: DanceNotefield
  private renderer: ChartRenderer
  private noteMap: Map<NotedataEntry, ExtendedNoteObject> = new Map

  constructor(notefield: DanceNotefield, renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.notefield = notefield
    this.sortableChildren = true
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
      arrow.deactivated = false
      arrow.marked = true
      arrow.dirtyTime = Date.now()
      arrow.y = yPos;
      if (isHoldNote(note)) {
        DanceNoteRenderer.setHoldLength(arrow, holdLength)
        if (note.gameplay?.lastHoldActivation) {
          let t = (Date.now() - note.gameplay.lastHoldActivation)/TimingWindowCollection.getCollection(Options.play.timingCollection).getHeldJudgement(note).getTimingWindowMS()
          t = Math.min(1.2, t)
          DanceNoteRenderer.setHoldBrightness(arrow, 1-t*0.7)
        }else{
          DanceNoteRenderer.setHoldBrightness(arrow, 0.8)
        }
      }
      if (note.type == "Fake") {
        DanceNoteRenderer.hideFakeIcon(arrow, this.renderer.chartManager.getMode() == EditMode.Play)
      }
    }

    DanceNoteTexture.setArrowTexTime(beat, time)

    //Remove old elements
    
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      this.noteMap.delete(child.note)
    })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(note: NotedataEntry, beat: number): [boolean, boolean, number, number] {
    let y = Options.chart.receptorYPos
    if (!isHoldNote(note) || (!note.gameplay?.lastHoldActivation || beat < note.beat)) y = this.renderer.getYPos(note.beat)
    if (isHoldNote(note) && note.gameplay?.droppedHoldBeat) y = this.renderer.getYPos(note.gameplay.droppedHoldBeat)
    let y_hold = this.renderer.getYPos(note.beat + (isHoldNote(note) ? note.hold : 0))
    if (isHoldNote(note) && !note.gameplay?.droppedHoldBeat && note.gameplay?.lastHoldActivation && note.beat + note.hold < beat) return [true, false, y, y_hold - y]
    if (y_hold < -32 - this.renderer.y) return [true, false, y, y_hold - y]
    if (y > this.renderer.chartManager.app.renderer.screen.height-this.renderer.y+32) {
      if (note.beat < beat || this.renderer.isNegScroll(note.beat)) return [true, false, y, y_hold - y]
      else return [true, true, y, y_hold - y]
    } 
    return [false, false, y, y_hold - y]
  }

  private getNote(note: NotedataEntry): ExtendedNoteObject {
    if (this.noteMap.get(note)) return this.noteMap.get(note)!
    let newChild: Partial<ExtendedNoteObject> | undefined
    for (let child of this.children) {
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
    this.buildObject(newChild)
    this.noteMap.set(note, newChild as ExtendedNoteObject)
    this.addChild(newChild as ExtendedNoteObject)
    return newChild as ExtendedNoteObject
  }

  private buildObject(noteObj: Partial<ExtendedNoteObject>) {
    DanceNoteRenderer.setData(this.notefield, noteObj as ExtendedNoteObject, noteObj.note!)
    noteObj.x = this.notefield.getColX(noteObj.note!.col)
  }
}