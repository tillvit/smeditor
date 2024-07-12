import { Container } from "pixi.js"
import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { NoteSkinRegistry } from "../../gameTypes/NoteSkinRegistry"
import {
  NoteObject,
  NoteSkin,
  NoteSkinOptions,
} from "../../gameTypes/base/Noteskin"
import { TimingWindow } from "../../play/TimingWindow"
import { NotedataEntry } from "../../sm/NoteTypes"
import { HoldJudgmentContainer } from "./HoldJudgmentContainer"
import { NoteContainer } from "./NoteContainer"
import { NoteFlashContainer } from "./NoteFlashContainer"
import { ReceptorContainer } from "./ReceptorContainer"
import { SelectionNoteContainer } from "./SelectionNoteContainer"

export class Notefield extends Container implements ChartRendererComponent {
  readonly noteskinOptions!: NoteSkinOptions
  readonly noteskin!: NoteSkin
  readonly gameType
  readonly renderer
  private readonly receptors!: ReceptorContainer
  private readonly notes!: NoteContainer
  private readonly selectionNotes!: SelectionNoteContainer
  private readonly flashes!: NoteFlashContainer
  private readonly holdJudges!: HoldJudgmentContainer
  private ghostNote?: NoteObject
  private ghostNoteEntry?: NotedataEntry

  private readonly columnX: number[] = []

  constructor(renderer: ChartRenderer) {
    super()

    this.renderer = renderer
    this.gameType = renderer.chart.gameType
    const noteskinOptions = NoteSkinRegistry.getNoteSkin(
      this.gameType,
      Options.chart.noteskin[renderer.chart.gameType.id]
    )

    if (!noteskinOptions) {
      WaterfallManager.createFormatted(
        "Couldn't find an available noteskin!",
        "error"
      )
      return
    }

    // Calculate column x positions
    let accumulatedWidth = 0

    for (let colNum = 0; colNum < this.gameType.numCols; colNum++) {
      const colWidth = this.gameType.columnWidths[colNum]
      this.columnX.push(
        accumulatedWidth - this.gameType.notefieldWidth / 2 + colWidth / 2
      )
      accumulatedWidth += colWidth
    }

    this.noteskinOptions = noteskinOptions
    this.noteskin = new this.noteskinOptions.object(renderer)

    this.receptors = new ReceptorContainer(this)
    this.flashes = new NoteFlashContainer(this)
    this.notes = new NoteContainer(this)
    this.selectionNotes = new SelectionNoteContainer(this)

    this.holdJudges = new HoldJudgmentContainer(this)
    this.addChild(
      this.receptors,
      this.notes,
      this.selectionNotes,
      this.flashes,
      this.holdJudges
    )
  }

  setGhostNote(note?: NotedataEntry): void {
    this.ghostNote?.destroy()
    this.ghostNote = undefined
    this.ghostNoteEntry = note
    if (!note) return
    this.ghostNote = this.noteskin.createNote(
      note,
      this.getColumnName(note.col)
    )
    this.addChildAt(this.ghostNote, 1)
    this.ghostNote.alpha = 0.4
    this.ghostNote.x = this.getColumnX(note.col)
    this.ghostNote.y = this.renderer.getYPosFromBeat(note.beat)
  }

  getNoteSprite(note: NotedataEntry): NoteObject {
    const spr = this.noteskin.createNote(note, this.getColumnName(note.col))
    return spr
  }

  update(firstBeat: number, lastBeat: number): void {
    this.noteskin.update()
    this.receptors.update(this.renderer.getVisualBeat())
    this.flashes.update()
    this.notes.update(firstBeat, lastBeat)
    this.selectionNotes.update(firstBeat, lastBeat)
    this.holdJudges.update()

    if (this.ghostNote) {
      this.ghostNote.y = this.renderer.getYPosFromBeat(
        this.ghostNoteEntry!.beat
      )
      this.ghostNote.visible =
        Options.chart.mousePlacement &&
        this.renderer.chartManager.getMode() == EditMode.Edit &&
        this.renderer.chartManager.editTimingMode == EditTimingMode.Off &&
        this.ghostNoteEntry!.beat >= firstBeat &&
        this.ghostNoteEntry!.beat <= lastBeat &&
        this.ghostNoteEntry!.beat >= 0
    }
  }

  onJudgment(col: number, judge: TimingWindow): void {
    this.flashes.createNoteFlash(col, judge)
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
    this.flashes.createHoldNoteFlash(col)
  }

  getColumnX(col: number) {
    return this.columnX[col] ?? 0
  }

  getColumnName(col: number) {
    return this.gameType.columnNames[col]
  }
}
