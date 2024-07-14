import { ChartManager } from "../../ChartManager"
import { Notedata, NotedataEntry } from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"

export abstract class GameLogic {
  /**
   * Called every frame to update the game logic
   *
   * @abstract
   * @param {ChartManager} chartManager
   * @memberof GameLogic
   */
  abstract update(chartManager: ChartManager): void

  /**
   * Called when play mode is started.
   *
   * @abstract
   * @param {ChartManager} chartManager
   * @memberof GameLogic
   */
  abstract startPlay(chartManager: ChartManager): void

  /**
   * Called when a column is pressed down.
   *
   * @abstract
   * @param chartManager
   * @param {number} col
   * @memberof GameLogic
   */
  abstract keyDown(chartManager: ChartManager, col: number): void

  /**
   * Called when a column is released.
   *
   * @abstract
   * @param chartManager
   * @param {number} col
   * @memberof GameLogic
   */
  abstract keyUp(chartManager: ChartManager, col: number): void

  /**
   * Determines whether a note should activate assist tick.
   *
   * @abstract
   * @param {NotedataEntry} note
   * @return {*}  {boolean}
   * @memberof GameLogic
   */
  abstract shouldAssistTick(note: NotedataEntry): boolean

  abstract calculateMaxDP(notedata: Notedata, timingData: TimingData): number

  abstract usesHoldTicks: boolean
}
