import { EventHandler } from "../../util/EventHandler"
import { maxArr } from "../../util/Math"
import { Chart } from "../sm/Chart"
import { ChartAnalyzer } from "./ChartAnalyzer"
import { NoteTypeAnalyzer } from "./NoteTypeAnalyzer"
import { NPSAnalyzer } from "./NPSAnalyzer"
import { ParityAnalyzer } from "./parity/ParityAnalyzer"
import { ParityInternals } from "./parity/ParityInternals"
import { StreamAnalyzer, StreamData } from "./StreamAnalyzer"

const ANALYZERS: (new (chart: Chart) => ChartAnalyzer)[] = [
  StreamAnalyzer,
  NPSAnalyzer,
  NoteTypeAnalyzer,
  ParityAnalyzer,
]

const UPDATE_INTERVAL = 250

export class ChartStats {
  noteCounts: Record<string, number> = {}
  npsGraph: number[] = []
  streams: StreamData[] = []
  parity?: ParityInternals

  readonly chart

  private analyzers: ChartAnalyzer[]
  private lastUpdate: number | null = null
  private queued = false
  private loaded = false

  private readonly loadHandler = ((chart: Chart | null) => {
    if (chart != this.chart && this.loaded) {
      this.loaded = false
      this.analyzers.forEach(a => a.onUnload())
    }
    if (chart == this.chart && !this.loaded) {
      this.loaded = true
      this.analyzers.forEach(a => a.onLoad())
    }
  }).bind(this)

  constructor(chart: Chart) {
    this.chart = chart
    this.analyzers = ANALYZERS.map(a => new a(chart))

    EventHandler.on("chartLoaded", this.loadHandler)
  }

  calculate() {
    this.analyzers.forEach(a => {
      a.calculateAll()
    })
  }

  private _recalculate(startBeat: number, endBeat: number) {
    console.log(`Recalculating stats for ${startBeat}-${endBeat}`)
    this.analyzers.forEach(a => {
      a.recalculate(startBeat, endBeat)
    })
  }

  recalculate(startBeat: number, endBeat: number) {
    if (!this.lastUpdate || Date.now() - this.lastUpdate > UPDATE_INTERVAL) {
      this._recalculate(startBeat, endBeat)
      this.lastUpdate = Date.now()
      this.queued = false
    } else {
      if (!this.queued) {
        setTimeout(() => {
          this._recalculate(startBeat, endBeat)
          this.lastUpdate = Date.now()
          this.queued = false
        }, UPDATE_INTERVAL)
        this.queued = true
      }
    }
  }

  reset() {
    this.analyzers.forEach(a => a.reset())
  }

  getMaxNPS() {
    const maxNPS = maxArr(this.npsGraph)
    if (maxNPS == 0) return 0
    return maxNPS
  }

  destroy() {
    this.analyzers.forEach(a => a.destroy())
    EventHandler.off("chartLoaded", this.loadHandler)
  }
}
