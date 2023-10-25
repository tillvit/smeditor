import { Container } from "pixi.js"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { NotedataEntry, isHoldNote } from "../../sm/NoteTypes"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"
import { DanceNoteTexture } from "./DanceNoteTexture"
import { DanceNotefield } from "./DanceNotefield"

interface ExtendedNoteObject extends NoteObject {
  note: NotedataEntry
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

export class NoteContainer extends Container {
  children: ExtendedNoteObject[] = []

  private readonly notefield: DanceNotefield
  private arrowMap: Map<NotedataEntry, NoteObject> = new Map()
  private arrowPool = new DisplayObjectPool({
    create: () => DanceNoteRenderer.createArrow(),
  })
  private notesDirty = false

  constructor(notefield: DanceNotefield) {
    super()
    this.notefield = notefield
    this.arrowPool.sortableChildren = true
    this.addChild(this.arrowPool)
    const timeSig = () => {
      for (const [note, arrow] of this.arrowMap.entries()) {
        DanceNoteRenderer.setData(
          this.notefield,
          arrow,
          note,
          this.notefield.getTimingData()
        )
      }
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
    if (this.notesDirty) {
      const notedata = this.notefield.getNotedata()
      for (const [note, arrow] of this.arrowMap.entries()) {
        if (!notedata.includes(note)) {
          this.arrowPool.destroyChild(arrow)
          this.arrowMap.delete(note)
        }
      }
      this.notesDirty = false
    }

    DanceNoteTexture.setArrowTexTime(
      this.notefield.getBeat(),
      this.notefield.getTime()
    )

    for (const note of this.notefield.getNotedata()) {
      if (note.beat > toBeat) break
      if (!this.shouldDisplayNote(note, fromBeat, toBeat)) continue
      if (!this.arrowMap.has(note)) {
        const arrow = this.arrowPool.createChild()
        if (!arrow) continue
        arrow.x = this.notefield.getColX(note.col)
        arrow.zIndex = note.beat
        Object.assign(arrow, {
          zIndex: note.beat,
        })
        DanceNoteRenderer.setData(
          this.notefield,
          arrow,
          note,
          this.notefield.getTimingData()
        )
        this.notefield.getRenderer().registerDragNote(arrow, note)
        this.arrowMap.set(note, arrow)
      }
    }

    for (const [note, arrow] of this.arrowMap.entries()) {
      if (!this.shouldDisplayNote(note, fromBeat, toBeat)) {
        this.arrowPool.destroyChild(arrow)
        this.arrowMap.delete(note)
        continue
      }

      arrow.y = Options.chart.receptorYPos / Options.chart.zoom
      if (
        !isHoldNote(note) ||
        !note.gameplay?.lastHoldActivation ||
        this.notefield.getBeat() < note.beat
      )
        arrow.y = this.notefield.getRenderer().getYPosFromBeat(note.beat)
      if (isHoldNote(note) && note.gameplay?.droppedHoldBeat)
        arrow.y = this.notefield
          .getRenderer()
          .getYPosFromBeat(note.gameplay.droppedHoldBeat)

      arrow.item.scale.y = Options.chart.reverse ? -1 : 1
      if (isHoldNote(note)) {
        const holdLength =
          this.notefield
            .getRenderer()
            .getYPosFromBeat(note.beat + (isHoldNote(note) ? note.hold : 0)) -
          arrow.y
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
          this.notefield.getRenderer().chartManager.getMode() == EditMode.Play
        )
      }
      if (
        this.notefield.getRenderer().chartManager.editTimingMode ==
        EditTimingMode.Off
      ) {
        const inSelection =
          this.notefield.getRenderer().chartManager.getMode() !=
            EditMode.Play &&
          this.notefield.getRenderer().chartManager.isNoteInSelection(note)
        arrow.selection.alpha = inSelection
          ? Math.sin(Date.now() / 320) * 0.1 + 0.3
          : 0
        arrow.visible =
          !inSelection ||
          !this.notefield.getRenderer().chartManager.selection.shift
        const inSelectionBounds = this.notefield
          .getRenderer()
          .selectionTest(arrow)
        if (!inSelection && inSelectionBounds) {
          this.notefield.getRenderer().chartManager.addNoteToDragSelection(note)
        }
        if (inSelection && !inSelectionBounds) {
          this.notefield
            .getRenderer()
            .chartManager.removeNoteFromDragSelection(note)
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
}
