import { Container, Sprite, Texture } from "pixi.js"
import { rgbtoHex } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { NoteObject } from "../../gameTypes/base/Noteskin"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { NotedataEntry, isHoldNote } from "../../sm/NoteTypes"
import { Notefield } from "./Notefield"

interface HighlightedNoteObject extends Container {
  selection: Sprite
  object: NoteObject
}

export class NoteContainer extends Container {
  private readonly notefield: Notefield
  private arrowMap: Map<NotedataEntry, HighlightedNoteObject> = new Map()
  private notesDirty = false
  readonly children: HighlightedNoteObject[] = []

  constructor(notefield: Notefield) {
    super()
    this.notefield = notefield
    this.sortableChildren = true

    const timeSig = () => {
      this.arrowMap.clear()
      this.removeChildren()
    }
    const purgeNotes = () => (this.notesDirty = true)

    EventHandler.on("timeSigChanged", timeSig)
    EventHandler.on("chartModified", purgeNotes)
    this.on("destroyed", () => {
      EventHandler.off("timeSigChanged", timeSig)
      EventHandler.on("chartModified", purgeNotes)
    })
  }

  update(fromBeat: number, toBeat: number) {
    const notedata = this.notefield.renderer.chart.getNotedata()
    if (this.notesDirty) {
      for (const [note, container] of this.arrowMap.entries()) {
        if (!notedata.includes(note)) {
          container.destroy()
          this.arrowMap.delete(note)
        }
      }
      this.notesDirty = false
    }

    for (const note of notedata) {
      if (note.beat > toBeat) break
      if (!this.shouldDisplayNote(note, fromBeat, toBeat)) continue
      if (!this.arrowMap.has(note)) {
        const container = new Container() as HighlightedNoteObject
        const object = this.notefield.noteskin.createNote(note)
        Object.assign(container, {
          x: this.notefield.getColumnX(note.col),
          zIndex: note.beat,
        })
        object.note.rotation = this.notefield.getColumnRotation(note.col)
        const selection = new Sprite(Texture.WHITE)
        const objectBounds = object.getBounds()
        selection.x = objectBounds.x
        selection.y = objectBounds.y
        selection.width = objectBounds.width
        selection.height = objectBounds.height
        selection.alpha = 0
        this.notefield.renderer.registerDragNote(container, note)
        container.object = object
        container.selection = selection
        this.arrowMap.set(note, container)
        container.addChild(object, selection)
        this.addChild(container)
      }
    }

    for (const [note, container] of this.arrowMap.entries()) {
      if (!this.shouldDisplayNote(note, fromBeat, toBeat)) {
        container.object.destroy()
        container.selection.destroy()
        this.arrowMap.delete(note)
        continue
      }

      container.object.update(this.notefield.renderer)

      container.y = this.notefield.renderer.getActualReceptorYPos()
      if (
        !isHoldNote(note) ||
        !note.gameplay?.lastHoldActivation ||
        this.notefield.renderer.getVisualBeat() < note.beat
      )
        container.y = this.notefield.renderer.getYPosFromBeat(note.beat)
      if (isHoldNote(note) && note.gameplay?.droppedHoldBeat)
        container.y = this.notefield.renderer.getYPosFromBeat(
          note.gameplay.droppedHoldBeat
        )

      if (isHoldNote(note)) {
        const holdLength =
          this.notefield.renderer.getYPosFromBeat(
            note.beat + (isHoldNote(note) ? note.hold : 0)
          ) - container.y
        this.setHoldLength(container.object, holdLength)
        if (note.gameplay?.lastHoldActivation) {
          let t =
            (Date.now() - note.gameplay.lastHoldActivation) /
            TimingWindowCollection.getCollection(Options.play.timingCollection)
              .getHeldJudgement(note)
              .getTimingWindowMS()
          t = Math.min(1.2, t)
          this.setHoldBrightness(container.object, 1 - t * 0.7)
        } else {
          this.setHoldBrightness(container.object, 0.8)
        }
      }
      if (
        this.notefield.renderer.chartManager.editTimingMode ==
        EditTimingMode.Off
      ) {
        const inSelection =
          this.notefield.renderer.chartManager.getMode() != EditMode.Play &&
          this.notefield.renderer.chartManager.isNoteInSelection(note)
        container.selection.alpha = inSelection
          ? Math.sin(Date.now() / 320) * 0.1 + 0.3
          : 0
        if (inSelection && container.object.hold) {
          const objectBounds = container.object.getLocalBounds()
          container.selection.x = objectBounds.x
          container.selection.y = objectBounds.y
          container.selection.width = objectBounds.width
          container.selection.height = objectBounds.height
        }
        container.visible =
          !inSelection || !this.notefield.renderer.chartManager.selection.shift
        const inSelectionBounds = this.notefield.renderer.selectionTest(
          container.object
        )
        if (!inSelection && inSelectionBounds) {
          this.notefield.renderer.chartManager.addNoteToDragSelection(note)
        }
        if (inSelection && !inSelectionBounds) {
          this.notefield.renderer.chartManager.removeNoteFromDragSelection(note)
        }
      }
    }
  }

  private shouldDisplayNote(
    note: NotedataEntry,
    fromBeat: number,
    toBeat: number
  ) {
    if (note.gameplay?.hideNote) return false
    if (Options.chart.CMod && note.fake && Options.chart.hideFakedArrows)
      return false
    if (Options.chart.CMod && Options.chart.hideWarpedArrows && note.warped)
      return false
    if (note.beat + (isHoldNote(note) ? note.hold : 0) < fromBeat) return false
    return note.beat <= toBeat
  }

  private setHoldLength(object: NoteObject, length: number) {
    if (!object.hold) return
    object.hold.holdBody.height = length
    object.hold.holdBody.y = length
    object.hold.holdCap.y = length
    object.hold.holdCap.scale.y = length < 0 ? -0.5 : 0.5
  }

  private setHoldBrightness(object: NoteObject, brightness: number) {
    if (!object.hold) return
    object.hold.holdBody.tint = rgbtoHex(
      brightness * 255,
      brightness * 255,
      brightness * 255
    )
    object.hold.holdCap.tint = rgbtoHex(
      brightness * 255,
      brightness * 255,
      brightness * 255
    )
  }
}
