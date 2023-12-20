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
