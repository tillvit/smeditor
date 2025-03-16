import { Chart } from "../sm/Chart"

export abstract class ChartAnalyzer {
  protected chart

  constructor(chart: Chart) {
    this.chart = chart
  }

  /**
   * Clear any caches used by this analyzer. Timing events that affect timing will trigger the entire chart to be analyzed
   *
   * @abstract
   * @memberof ChartAnalyzer
   */
  abstract reset(): void

  /**
   * Calculate data for the entire chart. This method will be called after reset().
   * @abstract
   * @memberof ChartAnalyzer
   */
  abstract calculateAll(): void

  /**
   * Recalculate data for the chart for a given range of beats
   *
   * @abstract
   * @param {number} startBeat
   * @param {number} endBeat
   * @memberof ChartAnalyzer
   */
  abstract recalculate(startBeat: number, endBeat: number): void
}
