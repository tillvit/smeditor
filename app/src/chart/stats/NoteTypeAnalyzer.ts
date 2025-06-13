import { isHoldNote } from "../sm/NoteTypes"
import { ChartAnalyzer } from "./ChartAnalyzer"

export class NoteTypeAnalyzer extends ChartAnalyzer {
  calculateAll(): void {
    const notedata = this.chart.getNotedata()
    const stats: Record<string, number> = {
      Taps: 0,
      Jumps: 0,
      Hands: 0,
      Holds: 0,
      Rolls: 0,
      Mines: 0,
      Fakes: 0,
      Lifts: 0,
    }
    let row = -1
    let cols = 0
    const holdBeats: (number | undefined)[] = []
    for (const note of notedata) {
      if (note.beat != row) {
        let holdCols = 0
        for (let i = 0; i < holdBeats.length; i++) {
          if (holdBeats[i]) {
            if (row > holdBeats[i]!) holdBeats[i] = undefined
            else if (holdBeats[i]! < note.beat) holdCols++
          }
        }
        if (cols > 1) stats.Jumps++
        if (cols + holdCols > 2) stats.Hands++
        cols = 0
        row = note.beat
      }
      if (note.type != "Mine" && !note.fake && !note.warped) cols++
      if (note.fake || note.warped) {
        stats.Fakes++
        continue
      }
      switch (note.type) {
        case "Tap":
          stats.Taps++
          break
        case "Hold":
          stats.Holds++
          break
        case "Roll":
          stats.Rolls++
          break
        case "Lift":
          stats.Lifts++
          break
        case "Mine":
          stats.Mines++
          break
      }
      if (isHoldNote(note)) {
        holdBeats[note.col] = note.beat + note.hold
      }
    }
    let holdCols = 0
    for (let i = 0; i < holdBeats.length; i++) {
      if (holdBeats[i] && holdBeats[i]! < notedata[notedata.length - 1].beat)
        holdCols++
    }
    if (cols > 1) stats.Jumps++
    if (cols + holdCols > 2) stats.Hands++
    this.chart.stats.noteCounts = stats
  }
  recalculate(): void {
    this.calculateAll()
  }
}
