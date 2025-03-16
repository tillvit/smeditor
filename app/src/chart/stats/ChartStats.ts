import { maxArr } from "../../util/Math"
import { Chart } from "../sm/Chart"
import { ChartAnalyzer } from "./ChartAnalyzer"
import { NoteTypeAnalyzer } from "./NoteTypeAnalyzer"
import { NPSAnalyzer } from "./NPSAnalyzer"
import { StreamAnalyzer, StreamData } from "./stream/StreamAnalyzer"

const ANALYZERS: (new (chart: Chart) => ChartAnalyzer)[] = [
  StreamAnalyzer,
  NPSAnalyzer,
  NoteTypeAnalyzer,
]

export class ChartStats {
  noteCounts: Record<string, number> = {}
  npsGraph: number[] = []
  streams: StreamData[] = []

  readonly chart

  analyzers: ChartAnalyzer[]

  constructor(chart: Chart) {
    this.chart = chart
    this.analyzers = ANALYZERS.map(a => new a(chart))
  }

  calculate() {
    this.analyzers.forEach(a => {
      console.time(a.constructor.toString().split(" ")[1])
      a.calculateAll()
      console.timeEnd(a.constructor.toString().split(" ")[1])
    })
  }

  recalculate(startBeat: number, endBeat: number) {
    this.analyzers.forEach(a => {
      console.time(a.constructor.toString().split(" ")[1])
      a.recalculate(startBeat, endBeat)
      console.timeEnd(a.constructor.toString().split(" ")[1])
    })
  }

  reset() {
    this.analyzers.forEach(a => a.reset())
  }

  getMaxNPS() {
    return maxArr(this.npsGraph)
  }
}
