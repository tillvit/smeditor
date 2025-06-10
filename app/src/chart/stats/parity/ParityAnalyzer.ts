// Generates foot parity given notedata
// Original algorithm by Jewel, polished by tillvit

import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { Chart } from "../../sm/Chart"
import { ChartAnalyzer } from "../ChartAnalyzer"
import { ParityInternals } from "./ParityInternals"

export class ParityAnalyzer extends ChartAnalyzer {
  internals
  active = false

  private eventHandler = ((item: string) => {
    if (item !== "experimental.parity.enabled") return
    if (!Options.experimental.parity.enabled) {
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
    if (!this.active || !Options.experimental.parity.enabled) return
    this.chart.stats.parity = this.internals
    if (Options.experimental.parity.enabled) {
      this.internals.compute(startBeat, endBeat)
    }
  }

  calculateAll() {
    if (!this.active || !Options.experimental.parity.enabled) return
    this.chart.stats.parity = this.internals
    if (Options.experimental.parity.enabled) {
      this.internals.reset()
      this.internals.compute(0, this.chart.getLastBeat())
    }
  }

  onLoad(): void {
    this.active = true
    this.calculateAll()
  }

  onUnload(): void {
    this.active = false
    this.internals.deleteCache()
  }

  reset() {
    this.internals.reset()
  }

  destroy() {
    EventHandler.off("userOptionUpdated", this.eventHandler)
  }
}
