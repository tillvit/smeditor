import { Container } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { PartialNotedataEntry } from "../../sm/NoteTypes"

export abstract class Notefield extends Container {
  protected renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  abstract update(beat: number, fromBeat: number, toBeat: number): void

  abstract getNoteSprite(note: PartialNotedataEntry): Container

  abstract setGhostNote(note?: PartialNotedataEntry): void

  abstract reset(): void

  abstract doJudge(col: number, judge: TimingWindow): void

  abstract activateHold(col: number): void

  abstract keyDown(col: number): void

  abstract keyUp(col: number): void
}
