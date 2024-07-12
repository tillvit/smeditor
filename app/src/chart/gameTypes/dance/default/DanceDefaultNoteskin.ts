import { ChartRenderer } from "../../../ChartRenderer"
import { TimingWindow } from "../../../play/TimingWindow"
import { NotedataEntry } from "../../../sm/NoteTypes"
import { NoteSkin, NoteSkinOptions } from "../../base/Noteskin"
import { DanceDefaultNoteFlash } from "./DanceDefaultNoteFlashContainer"
import { DanceDefaultNoteObject } from "./DanceDefaultNoteRenderer"
import { DanceDefaultNoteTexture } from "./DanceDefaultNoteTexture"
import { DanceDefaultReceptor } from "./DanceDefaultReceptor"

export const rotationMap: Record<string, number> = {
  Left: 0 * (Math.PI / 180),
  UpLeft: 45 * (Math.PI / 180),
  Up: 90 * (Math.PI / 180),
  UpRight: 135 * (Math.PI / 180),
  Right: 180 * (Math.PI / 180),
  DownRight: 225 * (Math.PI / 180),
  Down: 270 * (Math.PI / 180),
  DownLeft: 315 * (Math.PI / 180),
}

class DanceDefaultNoteskinObject extends NoteSkin {
  constructor(renderer: ChartRenderer) {
    super(renderer)

    DanceDefaultNoteTexture.initArrowTex()
  }

  createReceptor(columnName: string) {
    return new DanceDefaultReceptor(columnName)
  }

  createNote(note: NotedataEntry, columnName: string) {
    return new DanceDefaultNoteObject(note, columnName)
  }

  createNoteFlash(judgement: TimingWindow, columnName: string) {
    return DanceDefaultNoteFlash.createJudgment(judgement, columnName)
  }

  createHoldNoteFlash(columnName: string) {
    return DanceDefaultNoteFlash.createHoldJudgment(columnName)
  }

  update(): void {
    DanceDefaultNoteTexture.setArrowTexTime(
      this.renderer.chartManager.app,
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
    "dance-threepanel",
    "dance-threedouble",
  ],
}
