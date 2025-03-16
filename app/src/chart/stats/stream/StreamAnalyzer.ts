import { isSameRow } from "../../../util/Util"
import { ChartAnalyzer } from "../ChartAnalyzer"

export interface StreamData {
  startBeat: number
  endBeat: number
  streamSpacing: number | null
}
export class StreamAnalyzer extends ChartAnalyzer {
  reset() {
    this.chart.stats.streams = []
  }

  private generateStreams(startBeat?: number, endBeat?: number) {
    const rows =
      startBeat !== undefined && endBeat !== undefined
        ? this.chart.getRowsInRange(startBeat, endBeat)
        : this.chart.getRows()
    const streams = []
    const differences = rows
      .slice(0, -1)
      .map((note, idx) => Math.round((rows[idx + 1].beat - note.beat) * 48))
    // consolidate differences into streams
    for (let i = 0; i < differences.length; i++) {
      const diff = differences[i]
      const startIdx = i
      while (differences[i + 1] == diff) {
        i++
      }
      streams.push({
        startBeat: rows[startIdx].beat,
        endBeat: rows[i + 1].beat,
        streamSpacing: diff / 48,
      })
    }
    return streams
  }

  calculateAll(): void {
    // console.log("Calculating all streams")
    const streams = this.generateStreams()
    this.chart.stats.streams = streams
  }

  recalculate(startBeat: number, endBeat: number): void {
    const cachedStreams = this.chart.stats.streams
    // Only need to recalculate streams that intersect the changed range
    // todo, convert segment searching to binary search in future?

    // Find stream segments that we need to recalculate

    // todo: redo
    let firstSegmentIdx = cachedStreams.findIndex(
      stream =>
        (stream.endBeat <= endBeat && stream.endBeat >= startBeat) ||
        (stream.startBeat <= endBeat && stream.startBeat >= startBeat) ||
        (startBeat <= stream.endBeat && endBeat >= stream.startBeat) ||
        (startBeat <= stream.endBeat && startBeat >= stream.startBeat)
    )
    if (
      firstSegmentIdx > 0 &&
      !isSameRow(cachedStreams[firstSegmentIdx].endBeat, startBeat)
    )
      firstSegmentIdx--
    if (firstSegmentIdx == -1) {
      // handle start/end edge cases
      if (!cachedStreams[0] || startBeat < cachedStreams[0].startBeat)
        firstSegmentIdx = 0
      else if (startBeat > cachedStreams.at(-1)!.endBeat) {
        firstSegmentIdx = cachedStreams.length - 1
      }
    }
    let lastSegmentIndex = cachedStreams.findLastIndex(
      stream =>
        (stream.endBeat <= endBeat && stream.endBeat >= startBeat) ||
        (stream.startBeat <= endBeat && stream.startBeat >= startBeat) ||
        (startBeat <= stream.endBeat && endBeat >= stream.startBeat) ||
        (startBeat <= stream.endBeat && startBeat >= stream.startBeat)
    )
    if (lastSegmentIndex == -1) {
      // handle start/end edge cases
      if (!cachedStreams[0] || endBeat < cachedStreams[0].startBeat)
        lastSegmentIndex = 0
      else if (endBeat > cachedStreams.at(-1)!.endBeat) {
        lastSegmentIndex = cachedStreams.length - 1
      }
    }
    // console.log(
    //   firstSegmentIdx,
    //   lastSegmentIndex,
    //   cachedStreams.slice(firstSegmentIdx, lastSegmentIndex + 1)
    // )

    // Find area of notes we need to recalculate
    let calculateStart = cachedStreams[firstSegmentIdx]?.startBeat ?? startBeat
    calculateStart = Math.min(startBeat, calculateStart)
    let calculateEnd = cachedStreams[lastSegmentIndex]?.endBeat ?? endBeat
    calculateEnd = Math.max(endBeat, calculateEnd)
    // console.log("calculationArea", calculateStart, calculateEnd)
    const newStreams = this.generateStreams(calculateStart, calculateEnd)
    // console.log("newStreams", newStreams)

    this.chart.stats.streams = cachedStreams
      .slice(0, firstSegmentIdx)
      .concat(newStreams, cachedStreams.slice(lastSegmentIndex + 1))
  }
}
