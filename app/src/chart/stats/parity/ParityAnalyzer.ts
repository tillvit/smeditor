// Generates foot parity given notedata
// Original algorithm by Jewel, polished by tillvit

import { Chart } from "../../sm/Chart"
import { ChartAnalyzer } from "../ChartAnalyzer"
import { ParityInternals } from "./ParityInternal_Temp"

export class ParityAnalyzer extends ChartAnalyzer {
  internals

  constructor(chart: Chart) {
    super(chart)

    this.internals = new ParityInternals(chart)
  }

  recalculate(startBeat: number, endBeat: number) {
    this.chart.stats.parity = this.internals
    this.internals.compute(startBeat, endBeat)
  }

  calculateAll() {
    this.chart.stats.parity = this.internals
    this.internals.compute(0, this.chart.getLastBeat())
  }

  reset() {}
}
