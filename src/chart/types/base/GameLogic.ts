import { ChartManager } from "../../ChartManager"

export abstract class GameLogic {

  abstract update(chartManager: ChartManager): void

  abstract reset(chartManager: ChartManager): void

  abstract keyDown(chartManager: ChartManager, col: number): void

  abstract keyUp(chartManager: ChartManager, col: number): void

}