import { Container, Sprite, Texture } from "pixi.js"
import { NotedataEntry, isHoldNote } from "../../sm/NoteTypes"
import { HoldObject, Notefield, NotefieldObject } from "./Notefield"

interface HighlightedNoteObject extends Container {
  selection: Sprite
  object: NotefieldObject
}

export class SelectionNoteContainer extends Container {
  private readonly notefield: Notefield
  private readonly arrowMap: Map<NotedataEntry, HighlightedNoteObject> =
    new Map()
  readonly children: HighlightedNoteObject[] = []

  private lastBeatShift = 0
  private lastColShift = 0

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield
    this.sortableChildren = true
  }

  update(firstBeat: number, lastBeat: number) {
    if (!this.notefield.renderer.chartManager.selection.shift) {
      this.removeChildren()
      this.arrowMap.clear()
      return
    }
    const beatShift =
      this.notefield.renderer.chartManager.selection.shift.beatShift
    const columnShift =
      this.notefield.renderer.chartManager.selection.shift.columnShift

    if (this.lastBeatShift != beatShift || this.lastColShift != columnShift) {
      this.lastBeatShift = beatShift
      this.lastColShift = columnShift
      for (const [note, container] of this.arrowMap.entries()) {
        const newNote =
          this.notefield.renderer.chartManager.loadedChart!.computeNote({
            ...note,
            beat: note.beat + beatShift,
            col: note.col + columnShift,
          })

        container.x = this.notefield.getColumnX(newNote.col)
        container.object.destroy()
        container.object.alpha = 0.4
        container.object = this.notefield.createNote(newNote)
        const objectBounds = container.object.getBounds()
        container.selection.x = objectBounds.x
        container.selection.y = objectBounds.y
        container.selection.width = objectBounds.width
        container.selection.height = objectBounds.height
        container.addChild(container.object, container.selection)
      }
    }

    for (const note of this.notefield.renderer.chartManager.selection.notes) {
      if (
        note.beat + beatShift + (isHoldNote(note) ? note.hold : 0) <
        firstBeat
      )
        continue
      if (note.beat + beatShift > lastBeat) continue

      if (!this.arrowMap.has(note)) {
        const newNote = {
          ...note,
          beat: note.beat + beatShift,
          col: note.col + columnShift,
        }
        const container = new Container() as HighlightedNoteObject
        const object = this.notefield.createNote(newNote)
        Object.assign(container, {
          x: this.notefield.getColumnX(newNote.col),
          zIndex: newNote.beat,
          alpha: 0.4,
        })
        const selection = new Sprite(Texture.WHITE)
        const objectBounds = object.getBounds()
        selection.x = objectBounds.x
        selection.y = objectBounds.y
        selection.width = objectBounds.width
        selection.height = objectBounds.height
        selection.alpha = 0
        this.notefield.renderer.registerDragNote(object, newNote)
        container.object = object
        container.selection = selection
        this.arrowMap.set(note, container)
        container.addChild(object, selection)
        this.addChild(container)
      }
    }

    for (const [note, container] of this.arrowMap.entries()) {
      if (
        note.beat + beatShift + (isHoldNote(note) ? note.hold : 0) <
          firstBeat ||
        note.beat + beatShift > lastBeat
      ) {
        container.destroy()
        this.arrowMap.delete(note)
        continue
      }
      const newBeat = note.beat + beatShift
      container.y = this.notefield.renderer.getYPosFromBeat(newBeat)
      container.selection.alpha = Math.sin(Date.now() / 320) * 0.1 + 0.3
      if (isHoldNote(note)) {
        const holdLength =
          this.notefield.renderer.getYPosFromBeat(
            newBeat + (isHoldNote(note) ? note.hold : 0)
          ) - container.y
        const hold = container.object as HoldObject
        hold.setLength(holdLength)
        hold.setBrightness(1)
        const objectBounds = container.object.getLocalBounds()
        container.selection.x = objectBounds.x
        container.selection.y = objectBounds.y
        container.selection.width = objectBounds.width
        container.selection.height = objectBounds.height
      }
    }
  }
}
