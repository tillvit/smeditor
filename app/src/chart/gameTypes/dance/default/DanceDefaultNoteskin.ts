import { ChartRenderer } from "../../../ChartRenderer"
import { TimingWindow } from "../../../play/TimingWindow"
import { NotedataEntry } from "../../../sm/NoteTypes"
import { NoteSkin, NoteSkinOptions } from "../../base/Noteskin"
import { DanceDefaultNoteFlash } from "./DanceDefaultNoteFlashContainer"
import { DanceDefaultNoteObject } from "./DanceDefaultNoteRenderer"
import { DanceDefaultNoteTexture } from "./DanceDefaultNoteTexture"
import { DanceDefaultReceptor } from "./DanceDefaultReceptor"

import flashW4Url from "./assets/flash/decent.png"
import flashW2Url from "./assets/flash/excellent.png"
import flashW0Url from "./assets/flash/fantastic.png"
import flashW3Url from "./assets/flash/great.png"
import holdFlashUrl from "./assets/flash/hold.png"
import flashMineUrl from "./assets/flash/mine.png"
import flashW5Url from "./assets/flash/way_off.png"
import flashW1Url from "./assets/flash/white_fantastic.png"
import receptorUrl from "./assets/receptor.png"

import holdBodyUrl from "./assets/hold/body.png"
import holdCapUrl from "./assets/hold/cap.png"
import fakeIconUrl from "./assets/icon/fake.png"
import rollBodyUrl from "./assets/roll/body.png"
import rollCapUrl from "./assets/roll/cap.png"

import tapPartsUrl from "./assets/tap/parts.png"

export class DanceDefaultNoteskinObject extends NoteSkin {
  protected readonly textureBundle: [string, string][] = [
    ["w0", flashW0Url],
    ["w1", flashW1Url],
    ["w2", flashW2Url],
    ["w3", flashW3Url],
    ["w4", flashW4Url],
    ["w5", flashW5Url],
    ["mine", flashMineUrl],
    ["Flash", holdFlashUrl],
    ["Receptor", receptorUrl],
    ["HoldBody", holdBodyUrl],
    ["HoldCap", holdCapUrl],
    ["FakeIcon", fakeIconUrl],
    ["RollBody", rollBodyUrl],
    ["RollCap", rollCapUrl],
    ["TapParts", tapPartsUrl],
  ]

  constructor(renderer: ChartRenderer) {
    super(renderer)

    DanceDefaultNoteTexture.initArrowTex(renderer.chartManager.app, this)
  }

  createReceptor(_: number) {
    return new DanceDefaultReceptor(this)
  }

  createNote(note: NotedataEntry) {
    return new DanceDefaultNoteObject(this, note)
  }

  createNoteFlash(judgement: TimingWindow) {
    return DanceDefaultNoteFlash.createJudgment(this, judgement)
  }
  createHoldNoteFlash() {
    return DanceDefaultNoteFlash.createHoldJudgment(this)
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
    "dance-threepanel",
    "dance-threedouble",
  ],
  rotateColumns: true,
}
