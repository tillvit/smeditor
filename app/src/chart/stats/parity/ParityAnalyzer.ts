// Generates foot parity given notedata
// Original algorithm by Jewel, polished by tillvit

import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { Chart } from "../../sm/Chart"
import { ChartAnalyzer } from "../ChartAnalyzer"
import { ParityInternals } from "./ParityInternal_Temp"

export class ParityAnalyzer extends ChartAnalyzer {
  internals
  active = false

  private eventHandler = ((item: string) => {
    if (item !== "debug.showParity") return
    if (!Options.debug.showParity) {
      this.reset()
      return
    }
    this.calculateAll()
  }).bind(this)

  constructor(chart: Chart) {
    super(chart)

    this.internals = new ParityInternals(chart)

    EventHandler.on("userOptionUpdated", this.eventHandler)
  }

  recalculate(startBeat: number, endBeat: number) {
    if (!this.active || !Options.debug.showParity) return
    this.chart.stats.parity = this.internals
    if (Options.debug.showParity) {
      this.internals.compute(startBeat, endBeat)
    }
  }

  calculateAll() {
    if (!this.active || !Options.debug.showParity) return
    this.chart.stats.parity = this.internals
    if (Options.debug.showParity) {
      this.internals.compute(0, this.chart.getLastBeat())
    }
  }

  onLoad(): void {
    this.active = true
    this.calculateAll()
  }

  onUnload(): void {
    this.active = false
    this.reset()
  }

  reset() {
    this.internals.deleteCache()
  }

  destroy() {
    EventHandler.off("userOptionUpdated", this.eventHandler)
  }
}
