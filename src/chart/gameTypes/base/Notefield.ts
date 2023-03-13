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

  /**
   * Called every frame to update the notefield.
   *
   * @abstract
   * @param {number} beat - The current beat.
   * @param {number} fromBeat - The earliest beat to render.
   * @param {number} toBeat - The latest beat to render.
   * @memberof Notefield
   */
  abstract update(beat: number, fromBeat: number, toBeat: number): void

  /**
   * Creates a note sprite given a note entry.
   *
   * @abstract
   * @param {PartialNotedataEntry} note
   * @return {*}  {Container}
   * @memberof Notefield
   */
  abstract getNoteSprite(note: PartialNotedataEntry): Container

  /**
   * Sets the ghost note when using mouse note placement
   *
   * @abstract
   * @param {PartialNotedataEntry} [note]
   * @memberof Notefield
   */
  abstract setGhostNote(note?: PartialNotedataEntry): void

  /**
   * Called when play mode is exited.
   *
   * @abstract
   * @memberof Notefield
   */
  abstract endPlay(): void

  /**
   * Called when a judgment should be displayed.
   *
   * @abstract
   * @param {number} col
   * @param {TimingWindow} judge
   * @memberof Notefield
   */
  abstract doJudge(col: number, judge: TimingWindow): void

  /**
   * Called when a column starts holding.
   *
   * @abstract
   * @param {number} col
   * @memberof Notefield
   */
  abstract activateHold(col: number): void

  /**
   * Called when a column is pressed down.
   *
   * @abstract
   * @param {number} col
   * @memberof Notefield
   */
  abstract keyDown(col: number): void

  /**
   * Called when a column is released.
   *
   * @abstract
   * @param {number} col
   * @memberof Notefield
   */
  abstract keyUp(col: number): void
}
