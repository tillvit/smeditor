import { Container } from "pixi.js"
import { ChartRenderer } from "../ChartRenderer"
import { NoteRenderer } from "./NoteRenderer"
import { NoteTexture } from "./NoteTexture"
import { NotedataEntry } from "../sm/NoteTypes"

interface NoteObject extends Container {
  note: NotedataEntry,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number,
  cachedNote: NotedataEntry
}

export class NoteContainer extends Container {

  children: NoteObject[] = []

  private renderer: ChartRenderer
  private noteMap: Map<NotedataEntry, NoteObject> = new Map

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {

    //Reset mark of old objects
    this.children.forEach(child => child.marked = false)

    let time = this.renderer.chartManager.getTime()
    for (let note of this.renderer.chart.notedata) { 
      // note = JSON.parse(JSON.stringify(note))
      if (note.hide) continue
      if (this.renderer.options.chart.CMod && this.renderer.options.chart.hideWarpedArrows && note.warped) continue
      if (note.beat + (note.hold ?? 0) < fromBeat) continue
      if (note.beat > toBeat) break

      let [outOfBounds, endSearch, yPos, y_hold] = this.checkBounds(note, beat)
      if (endSearch) break
      if (outOfBounds) continue

      let arrow = this.getNote(note)
      if (JSON.stringify(arrow.cachedNote) != JSON.stringify(arrow.note)) this.buildObject(arrow)
      arrow.y = yPos;
      if (note.type == "Hold" || note.type == "Roll") {
        NoteRenderer.setHoldEnd(arrow, y_hold)
      }
      if (note.type == "Mine") {
        NoteRenderer.setMineTime(arrow, time)
      }
    }

    NoteTexture.setArrowTexTime(beat, time)

    //Remove old elements
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      this.noteMap.delete(child.note)
    })

    this.children.filter(child => Date.now() - child.dirtyTime > 5000).forEach(child => {
      this.removeChild(child)
    })
  }

  private checkBounds(note: NotedataEntry, beat: number): [boolean, boolean, number, number] {
    let y = this.renderer.options.chart.receptorYPos
    if (!note.lastActivation || note.lastActivation == -1) y = this.renderer.getYPos(note.beat)
    if (note.droppedBeat) y = this.renderer.getYPos(note.droppedBeat)
    let y_hold = this.renderer.getYPos(note.beat + (note.hold ?? 0))
    if (note.hold && !note.droppedBeat && note.lastActivation != -1 && note.beat + note.hold < beat) return [true, false, y, y_hold]
    if (y_hold < -32 - this.renderer.y) return [true, false, y, y_hold]
    if (y > this.renderer.chartManager.app.pixi.screen.height-this.renderer.y+32) {
      if (this.renderer.isNegScroll() || note.beat < beat) [true, false, y, y_hold]
      else [true, true, y, y_hold]
    } 
    return [false, false, y, y_hold]
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
      newChild = NoteRenderer.createArrow(note) as NoteObject
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
    noteObj.cachedNote = JSON.parse(JSON.stringify(noteObj.note))
    NoteRenderer.setData(noteObj as NoteObject, noteObj.note!)
    noteObj.x = noteObj.note!.col*64-96
  }
}