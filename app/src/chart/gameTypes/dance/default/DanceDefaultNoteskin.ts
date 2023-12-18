import { ChartRenderer } from "../../../ChartRenderer"
import { TimingWindow } from "../../../play/TimingWindow"
import { NotedataEntry } from "../../../sm/NoteTypes"
import { NoteSkin, NoteSkinOptions } from "../../base/Noteskin"
import { DanceDefaultNoteFlash } from "./DanceDefaultNoteFlashContainer"
import { DanceDefaultNoteObject } from "./DanceDefaultNoteRenderer"
import { DanceDefaultNoteTexture } from "./DanceDefaultNoteTexture"
import { DanceDefaultReceptor } from "./DanceDefaultReceptor"

class DanceDefaultNoteskinObject extends NoteSkin {
  constructor(renderer: ChartRenderer) {
    super(renderer)

    DanceDefaultNoteTexture.initArrowTex(renderer.chartManager.app)
  }

  createReceptor(_: number) {
    return new DanceDefaultReceptor()
  }

  createNote(note: NotedataEntry) {
    return new DanceDefaultNoteObject(note)
  }

  createNoteFlash(judgement: TimingWindow) {
    return DanceDefaultNoteFlash.createJudgment(judgement)
  }
  createHoldNoteFlash() {
    return DanceDefaultNoteFlash.createHoldJudgment()
  }

  update(): void {
    DanceDefaultNoteTexture.setArrowTexTime(
      this.renderer.getVisualBeat(),
      this.renderer.getVisualTime()
    )
  }

  // doJudge(col: number, judge: TimingWindow): void {
  //   this.flashes.addFlash(col, judge)
  //   this.holdJudges.addJudge(col, judge)
  // }

  // endPlay(): void {
  //   this.flashes.reset()
  // }

  // keyDown(col: number): void {
  //   this.receptors.keyDown(col)
  // }

  // keyUp(col: number): void {
  //   this.receptors.keyUp(col)
  // }

  // activateHold(col: number): void {
  //   this.flashes.activateHold(col)
  // }

  // getColX(col: number): number {
  //   return (col - this.getNumCols() / 2 + 0.5) * 64
  // }

  // getNumCols(): number {
  //   return this.renderer.chart.gameType.numCols
  // }

  // getRotFromCol(col: number): number {
  //   let ROTS = [0, -90, 90, 180]
  //   if (this.getNumCols() == 3) ROTS = [45, -90, 135]
  //   if (this.getNumCols() == 6 || this.getNumCols() == 12)
  //     ROTS = [0, 45, -90, 90, 135, 180]
  //   if (this.getNumCols() == 8) ROTS = [0, -90, 90, 180, 0, -90, 90, 180]
  //   return (ROTS[col % ROTS.length] / 180) * Math.PI
  // }
}

export const DanceDefaultNoteskin: NoteSkinOptions = {
  name: "default",
  object: DanceDefaultNoteskinObject,
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-3panel",
  ],
  rotateColumns: true,
}
