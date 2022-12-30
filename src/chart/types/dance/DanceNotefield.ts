import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { Notefield } from "../base/Notefield"
import { DanceNoteTexture } from "./DanceNoteTexture"
import { HoldJudgmentContainer } from "./HoldJudgmentContainer"
import { NoteContainer } from "./NoteContainer"
import { NoteFlashContainer } from "./NoteFlashContainer"
import { ReceptorContainer } from "./ReceptorContainer"

export class DanceNotefield extends Notefield {

  private receptors: ReceptorContainer
  private notes: NoteContainer
  private flashes: NoteFlashContainer
  private holdJudges: HoldJudgmentContainer

  constructor(renderer: ChartRenderer) {
    super(renderer)

    DanceNoteTexture.initArrowTex(renderer.chartManager.app)

    this.receptors = new ReceptorContainer(this, renderer)
    this.notes = new NoteContainer(this, renderer)
    this.flashes = new NoteFlashContainer(this)
    this.holdJudges = new HoldJudgmentContainer(this)
    this.addChild(this.receptors, this.notes, this.flashes, this.holdJudges)
  }

  update(beat: number, fromBeat: number, toBeat: number): void {
    this.receptors.renderThis(beat)
    this.notes.renderThis(beat, fromBeat, toBeat)
    this.flashes.renderThis()
    this.holdJudges.renderThis()
  }

  doJudge(col: number, judge: TimingWindow): void {
    this.flashes.addFlash(col, judge)
    this.holdJudges.addJudge(col, judge)
  }

  reset(): void {
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
    return (col-this.getNumCols()/2+0.5)*64
  }

  getNumCols(): number {
    return this.renderer.chart.gameType.numCols
  }

  getRotFromCol(col: number): number {
    let ROTS = [0,-90,90,180]
    if (this.getNumCols() == 3) ROTS = [0,90,180]
    return ROTS[col]/180*Math.PI;
  }
}