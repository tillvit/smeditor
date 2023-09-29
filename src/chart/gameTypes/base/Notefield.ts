import { Container } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { Notedata, PartialNotedataEntry } from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"

export abstract class Notefield extends Container {
  protected renderer: ChartRenderer

  protected constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  /**
   * Called every frame to update the notefield.
   *
   * @abstract
   * @param {number} fromBeat - The earliest beat to render.
   * @param {number} toBeat - The latest beat to render.
   * @memberof Notefield
   */
  abstract update(fromBeat: number, toBeat: number): void

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

  /**
   * Gets the current beat. This is affected by offsets.
   *
   * @return {*}  {number}
   * @memberof Notefield
   */
  getBeat(): number {
    return this.renderer.getVisualBeat()
  }

  /**
   * Gets the current second.
   *
   * @return {*}  {number}
   * @memberof Notefield
   */
  getTime(): number {
    return this.renderer.getVisualTime()
  }

  /**
   * Gets the current notedata.
   *
   * @return {*}  {Notedata}
   * @memberof Notefield
   */
  getNotedata(): Notedata {
    return this.renderer.chart.getNotedata()
  }

  /**
   * Gets the current notedata.
   *
   * @return {*}  {TimingData}
   * @memberof Notefield
   */
  getTimingData(): TimingData {
    return this.renderer.chart.timingData
  }

  /**
   * Gets the ChartRenderer.
   *
   * @return {*}  {ChartRenderer}
   * @memberof Notefield
   */
  getRenderer(): ChartRenderer {
    return this.renderer
  }
}
