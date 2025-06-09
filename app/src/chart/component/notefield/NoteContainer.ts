import { Container, Sprite, Texture } from "pixi.js"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { getNoteEnd } from "../../../util/Util"
import { EditTimingMode } from "../../ChartManager"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { isHoldNote, NotedataEntry } from "../../sm/NoteTypes"
import { PARITY_COLORS } from "../edit/ParityDebug"
import { HoldObject, Notefield, NoteWrapper } from "./Notefield"

interface HighlightedNoteObject extends Container {
  selection: Sprite
  parity: Sprite
  wrapper: NoteWrapper
  lastActive: boolean
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
      EventHandler.off("chartModified", purgeNotes)
    })
  }

  update(firstBeat: number, lastBeat: number) {
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
      if (note.beat > lastBeat) break
      if (!this.shouldDisplayNote(note, firstBeat, lastBeat)) continue
      if (!this.arrowMap.has(note)) {
        const container = new Container() as HighlightedNoteObject
        const object = this.notefield.createNote(note)
        Object.assign(container, {
          x: this.notefield.getColumnX(note.col),
          zIndex: note.beat,
        })
        const selection = new Sprite(Texture.WHITE)
        const objectBounds = object.getLocalBounds()
        selection.x = objectBounds.x
        selection.y = objectBounds.y
        selection.width = objectBounds.width
        selection.height = objectBounds.height
        selection.alpha = 0

        const parity = new Sprite(Texture.WHITE)
        parity.x = objectBounds.x
        parity.y = objectBounds.y
        parity.width = objectBounds.width
        parity.height = objectBounds.height
        parity.alpha = 0
        this.notefield.renderer.registerDragNote(container, note)
        container.wrapper = object
        container.selection = selection
        container.parity = parity
        container.lastActive = false
        this.arrowMap.set(note, container)
        container.addChild(object, selection, parity)
        this.addChild(container)
      }
    }

    for (const [note, container] of this.arrowMap.entries()) {
      if (!this.shouldDisplayNote(note, firstBeat, lastBeat)) {
        container.destroy()
        this.arrowMap.delete(note)
        continue
      }

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
          this.notefield.renderer.getYPosFromBeat(getNoteEnd(note)) -
          container.y
        const hold = container.wrapper.object as HoldObject
        hold.setLength(holdLength)
        if (note.gameplay?.lastHoldActivation) {
          let t =
            (Date.now() - note.gameplay.lastHoldActivation) /
            TimingWindowCollection.getCollection(Options.play.timingCollection)
              .getHeldJudgement(note)
              .getTimingWindowMS()
          t = Math.min(1.2, t)
          hold.setBrightness(1 - t * 0.7)
        } else {
          hold.setBrightness(1)
        }
        if (note.gameplay) {
          hold.setActive(
            !(
              note.gameplay.lastHoldActivation === undefined ||
              note.gameplay.droppedHoldBeat !== undefined
            )
          )
        } else {
          hold.setActive(false)
        }

        const objectBounds = container.wrapper.getLocalBounds()
        container.parity.x = objectBounds.x
        container.parity.y = objectBounds.y
        container.parity.width = objectBounds.width
        container.parity.height = objectBounds.height
      }
      if (
        this.notefield.renderer.chartManager.editTimingMode ==
        EditTimingMode.Off
      ) {
        const inSelection =
          this.notefield.renderer.shouldDisplayNoteSelection(note)
        container.selection.alpha = inSelection
          ? Math.sin(Date.now() / 320) * 0.1 + 0.3
          : 0
        if (inSelection && container.wrapper.object.type == "hold") {
          const objectBounds = container.wrapper.getLocalBounds()
          container.selection.x = objectBounds.x
          container.selection.y = objectBounds.y
          container.selection.width = objectBounds.width
          container.selection.height = objectBounds.height
        }
        container.visible =
          !inSelection || !this.notefield.renderer.chartManager.selection.shift
        const inSelectionBounds = this.notefield.renderer.selectionTest(
          container.wrapper
        )
        if (!inSelection && inSelectionBounds) {
          this.notefield.renderer.chartManager.addNoteToDragSelection(note)
        }
        if (inSelection && !inSelectionBounds) {
          this.notefield.renderer.chartManager.removeNoteFromDragSelection(note)
        }
      }
      if (Options.debug.showParity) {
        container.parity.alpha = note.parity ? 0.4 : 0
        container.parity.tint =
          note.parity !== undefined ? PARITY_COLORS[note.parity.foot] : 0xffffff
      }
    }
  }

  private shouldDisplayNote(
    note: NotedataEntry,
    firstBeat: number,
    lastBeat: number
  ) {
    if (note.gameplay?.hideNote) return false
    if (Options.chart.CMod && note.fake && Options.chart.hideFakedArrows)
      return false
    if (Options.chart.CMod && Options.chart.hideWarpedArrows && note.warped)
      return false
    if (getNoteEnd(note) < firstBeat) return false
    return note.beat <= lastBeat
  }
}
