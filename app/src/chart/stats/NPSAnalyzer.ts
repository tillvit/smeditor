import { isSameRow } from "../../util/Util"
import { ChartAnalyzer } from "./ChartAnalyzer"

export class NPSAnalyzer extends ChartAnalyzer {
  reset(): void {
    this.chart.stats.npsGraph = []
  }

  // Calculate NPS for measures start-end (inclusive)
  private calculateNPS(startMeasure?: number, endMeasure?: number) {
    const timingData = this.chart.timingData
    const startBeat = timingData.getBeatFromMeasure(startMeasure ?? 0)
    const endBeat =
      endMeasure === undefined
        ? this.chart.getLastBeat()
        : timingData.getBeatFromMeasure(endMeasure + 1)
    const notedata = this.chart.getNotedataInRange(startBeat, endBeat)
    // Remove notedata including last beat
    while (notedata.at(-1) && isSameRow(notedata.at(-1)!.beat, endBeat)) {
      notedata.pop()
    }
    if (notedata.length == 0) return []
    const nps = []

    let noteIndex = 0
    while (notedata[noteIndex]) {
      const measure = Math.floor(
        timingData.getMeasure(notedata[noteIndex].beat)
      )
      const measureStartBeat = timingData.getBeatFromMeasure(measure)
      const measureEndBeat = timingData.getBeatFromMeasure(measure + 1)
      const deltaTime =
        timingData.getSecondsFromBeat(measureEndBeat) -
        timingData.getSecondsFromBeat(measureStartBeat)
      if (deltaTime <= 0.05) {
        while (notedata[noteIndex]?.beat < measureEndBeat) noteIndex++
        nps[measure] = 0
        continue
      }
      let noteCount = 0
      while (notedata[noteIndex]?.beat < measureEndBeat) {
        const type = notedata[noteIndex].type
        if (
          !notedata[noteIndex].fake &&
          !notedata[noteIndex].warped &&
          (type == "Hold" || type == "Roll" || type == "Tap" || type == "Lift")
        )
          noteCount++
        noteIndex++
      }
      nps[measure] = noteCount / deltaTime
    }
    return nps
  }

  calculateAll(): void {
    this.chart.stats.npsGraph = this.calculateNPS()
  }
  recalculate(startBeat: number, endBeat: number): void {
    const timingData = this.chart.timingData
    const startMeasure = Math.floor(timingData.getMeasure(startBeat))
    const endMeasure = Math.floor(timingData.getMeasure(endBeat))
    const newNPS = this.calculateNPS(startMeasure, endMeasure)
    for (let measure = startMeasure; measure <= endMeasure; measure++) {
      if (newNPS[measure] !== undefined)
        this.chart.stats.npsGraph[measure] = newNPS[measure]
      else delete this.chart.stats.npsGraph[measure]
    }
    this.calculateAll()
  }
}
