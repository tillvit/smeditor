import { maxArr } from "../../util/Math"
import { Chart } from "../sm/Chart"
import { ChartAnalyzer } from "./ChartAnalyzer"
import { NoteTypeAnalyzer } from "./NoteTypeAnalyzer"
import { NPSAnalyzer } from "./NPSAnalyzer"
import { StreamAnalyzer, StreamData } from "./StreamAnalyzer"

const ANALYZERS: (new (chart: Chart) => ChartAnalyzer)[] = [
  StreamAnalyzer,
  NPSAnalyzer,
  NoteTypeAnalyzer,
  // ParityAnalyzer,
]

const UPDATE_INTERVAL = 250

export class ChartStats {
  noteCounts: Record<string, number> = {}
  npsGraph: number[] = []
  streams: StreamData[] = []

  readonly chart

  private analyzers: ChartAnalyzer[]
  private lastUpdate: number | null = null
  private queued = false

  constructor(chart: Chart) {
    this.chart = chart
    this.analyzers = ANALYZERS.map(a => new a(chart))
  }

  calculate() {
    console.log(`Recalculating stats`)
    console.time("total")
    this.analyzers.forEach(a => {
      console.time(a.constructor.toString().split(" ")[1])
      a.calculateAll()
      console.timeEnd(a.constructor.toString().split(" ")[1])
    })
    console.timeEnd("total")
  }

  private _recalculate(startBeat: number, endBeat: number) {
    console.log(`Recalculating stats for ${startBeat}-${endBeat}`)
    console.time("total")
    this.analyzers.forEach(a => {
      console.time(a.constructor.toString().split(" ")[1])
      a.recalculate(startBeat, endBeat)
      console.timeEnd(a.constructor.toString().split(" ")[1])
    })
    console.timeEnd("total")
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
}
