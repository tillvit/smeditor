import { ChartRenderer } from "../../../ChartRenderer"
import { TimingWindow } from "../../../play/TimingWindow"
import { NotedataEntry } from "../../../sm/NoteTypes"
import { NoteSkin, NoteSkinOptions } from "../../base/Noteskin"
import { PumpDefaultNoteFlash } from "./DanceDefaultNoteFlashContainer"
import { PumpDefaultNoteObject } from "./PumpDefaultNoteRenderer"
import { PumpDefaultNoteTexture } from "./PumpDefaultNoteTexture"
import { PumpDefaultReceptor } from "./PumpDefaultReceptor"

export const rotationMap: Record<string, number> = {
  Center: 0,
  DownLeft: 0,
  UpLeft: 90,
  UpRight: 180,
  DownRight: 270,
}

class PumpDefaultNoteskinObject extends NoteSkin {
  constructor(renderer: ChartRenderer) {
    super(renderer)

    PumpDefaultNoteTexture.initArrowTex()
  }

  createReceptor(columnName: string) {
    return new PumpDefaultReceptor(columnName)
  }

  createNote(note: NotedataEntry, columnName: string) {
    return new PumpDefaultNoteObject(note, columnName)
  }

  createNoteFlash(judgement: TimingWindow) {
    return PumpDefaultNoteFlash.createJudgment(judgement)
  }
  createHoldNoteFlash() {
    return PumpDefaultNoteFlash.createHoldJudgment()
  }

  update(): void {
    PumpDefaultNoteTexture.setArrowTexTime(
      this.renderer.chartManager.app,
      this.renderer.getVisualBeat(),
      this.renderer.getVisualTime()
    )
  }
}

export const PumpDefaultNoteskin: NoteSkinOptions = {
  name: "default",
  object: PumpDefaultNoteskinObject,
  gameTypes: ["pump-single"],
}
