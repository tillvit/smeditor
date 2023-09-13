import { Container } from "pixi.js"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { PartialNotedataEntry } from "../../sm/NoteTypes"
import { Notefield } from "../base/Notefield"
import { DanceNoteRenderer, NoteObject } from "./DanceNoteRenderer"
import { DanceNoteTexture } from "./DanceNoteTexture"
import { HoldJudgmentContainer } from "./HoldJudgmentContainer"
import { NoteContainer } from "./NoteContainer"
import { NoteFlashContainer } from "./NoteFlashContainer"
import { ReceptorContainer } from "./ReceptorContainer"
import { SelectionNoteContainer } from "./SelectionNoteContainer"

export class DanceNotefield
  extends Notefield
  implements ChartRendererComponent
{
  private receptors: ReceptorContainer
  private notes: NoteContainer
  private selectionNotes: SelectionNoteContainer
  private flashes: NoteFlashContainer
  private holdJudges: HoldJudgmentContainer
  private ghostNote: NoteObject
  private ghostNoteEntry?: PartialNotedataEntry

  constructor(renderer: ChartRenderer) {
    super(renderer)

    DanceNoteTexture.initArrowTex(renderer.chartManager.app)

    this.receptors = new ReceptorContainer(this)
    this.notes = new NoteContainer(this)
    this.selectionNotes = new SelectionNoteContainer(this)
    this.flashes = new NoteFlashContainer(this)
    this.holdJudges = new HoldJudgmentContainer(this)
    this.ghostNote = DanceNoteRenderer.createArrow()
    this.ghostNote.visible = false
    this.ghostNote.alpha = 0.4
    this.addChild(
      this.receptors,
      this.ghostNote,
      this.notes,
      this.selectionNotes,
      this.flashes,
      this.holdJudges
    )
  }

  setGhostNote(note?: PartialNotedataEntry): void {
    this.ghostNoteEntry = note
    if (!note) {
      this.ghostNote.visible = false
      return
    }
    DanceNoteRenderer.setData(
      this,
      this.ghostNote,
      note,
      this.renderer.chart.timingData
    )
    this.ghostNote.x = this.getColX(note.col)
  }

  getNoteSprite(note: PartialNotedataEntry): Container {
    const spr = DanceNoteRenderer.createArrow()
    DanceNoteRenderer.setData(this, spr, note, this.renderer.chart.timingData)
    return spr
  }

  update(fromBeat: number, toBeat: number): void {
    this.receptors.update()
    this.notes.update(fromBeat, toBeat)
    this.selectionNotes.update(fromBeat, toBeat)
    this.flashes.update()
    this.holdJudges.update()

    if (this.ghostNoteEntry) {
      this.ghostNote.y = this.renderer.getYPosFromBeat(this.ghostNoteEntry.beat)
      this.ghostNote.item.scale.y = Options.chart.reverse ? -1 : 1
      this.ghostNote.visible =
        Options.general.mousePlacement &&
        this.renderer.chartManager.getMode() == EditMode.Edit &&
        this.renderer.chartManager.editTimingMode == EditTimingMode.Off &&
        this.ghostNoteEntry.beat >= fromBeat &&
        this.ghostNoteEntry.beat <= toBeat &&
        this.ghostNoteEntry.beat >= 0
    }
  }

  doJudge(col: number, judge: TimingWindow): void {
    this.flashes.addFlash(col, judge)
    this.holdJudges.addJudge(col, judge)
  }

  endPlay(): void {
    this.flashes.reset()
  }

  keyDown(col: number): void {
    this.receptors.keyDown(col)
  }

  keyUp(col: number): void {
    this.receptors.keyUp(col)
  }

  activateHold(col: number): void {
    this.flashes.activateHold(col)
  }

  getColX(col: number): number {
    return (col - this.getNumCols() / 2 + 0.5) * 64
  }

  getNumCols(): number {
    return this.renderer.chart.gameType.numCols
  }

  getRotFromCol(col: number): number {
    let ROTS = [0, -90, 90, 180]
    if (this.getNumCols() == 3) ROTS = [45, -90, 135]
    if (this.getNumCols() == 6 || this.getNumCols() == 12)
      ROTS = [0, 45, -90, 90, 135, 180]
    if (this.getNumCols() == 8) ROTS = [0, -90, 90, 180, 0, -90, 90, 180]
    return (ROTS[col % ROTS.length] / 180) * Math.PI
  }
}
