import { getDivision, lcm, lcm2, roundDigit } from "../../../util/Util"
import {
  isHoldNote,
  Notedata,
  NotedataStats,
  PartialHoldNotedataEntry,
  PartialNotedata,
  PartialNotedataEntry,
} from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"
import { NotedataParser } from "../base/NotedataParser"
import { GameType } from "../GameTypeRegistry"

const NOTE_TYPE_LOOKUP: Record<string, string> = {
  "1": "Tap",
  "2": "Hold",
  "4": "Roll",
  M: "Mine",
  F: "Fake",
  L: "Lift",
}

const NOTE_TYPE_LOOKUP_REV: Record<string, string> = {
  Tap: "1",
  Hold: "2",
  Roll: "4",
  Mine: "M",
  Fake: "F",
  Lift: "L",
}

export class BasicNotedataParser extends NotedataParser {
  serialize(notedata: PartialNotedata, gameType: GameType): string {
    if (notedata.length == 0) return ""
    const measures = []
    let nIndex = 0
    const holdEnds: PartialHoldNotedataEntry[] = notedata.filter(isHoldNote)
    const lastNote = notedata.at(-1)!
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    for (let measure = 0; measure < Math.floor(lastBeat / 4); measure++) {
      let measureString = "// measure " + measure + "\n"
      const measureNotes = []
      while (notedata[nIndex]?.beat < measure * 4 + 4) {
        measureNotes.push(notedata[nIndex++])
      }
      const measureHoldNotes = []
      while (holdEnds[0]?.beat + holdEnds[0]?.hold < measure * 4 + 4) {
        measureHoldNotes.push(holdEnds.shift()!)
      }
      const division = Math.max(
        4,
        lcm2(
          lcm(measureNotes.map(note => getDivision(note.beat))),
          lcm(measureHoldNotes.map(note => getDivision(note.beat + note.hold)))
        )
      )
      for (let div = 0; div < division; div++) {
        const beat = measure * 4 + (4 / division) * div
        const row = new Array(gameType.numCols).fill("0")
        while (
          roundDigit(measureNotes[0]?.beat ?? -1, 3) == roundDigit(beat, 3)
        ) {
          const note = measureNotes.shift()!
          row[note.col] = NOTE_TYPE_LOOKUP_REV[note.type]
        }
        while (
          roundDigit(
            measureHoldNotes[0]?.beat + measureHoldNotes[0]?.hold ?? -1,
            3
          ) == roundDigit(beat, 3)
        ) {
          const note = measureHoldNotes.shift()!
          row[note.col] = "3"
        }
        measureString += row.join("") + "\n"
      }
      measures.push(measureString)
    }
    return measures.join(",  ")
  }

  fromString(data: string): PartialNotedata {
    const measures = data.split(",")
    const notedata: PartialNotedata = []
    const holds: (PartialNotedataEntry | undefined)[] = []
    for (let measure_num = 0; measure_num < measures.length; measure_num++) {
      const rows = measures[measure_num].trim().split("\n")
      for (let row_index = 0; row_index < rows.length; row_index++) {
        const row = rows[row_index].trim()
        let col = 0
        for (let c = 0; c < row.length; c++) {
          const beat = measure_num * 4 + (row_index / rows.length) * 4
          let type = row[c]
          if (type == "D" && row[c + 1] == "L") {
            //why
            type = "3"
            c++
          }
          if (type != "0" && type != "3") {
            const entry = {
              beat: beat,
              col: col,
              type: NOTE_TYPE_LOOKUP[type],
            } satisfies PartialNotedataEntry
            if (entry.type == undefined) {
              console.log(
                "Unknown note type " + type + " at beat " + beat + " col " + col
              )
              continue
            }
            if (type == "2" || type == "4") {
              if (holds[col]) {
                console.log(
                  "Missing end of hold/roll for note " +
                    JSON.stringify(holds[col])
                )
              }
              holds[col] = entry
            }
            notedata.push(entry)
          }
          if (type == "3") {
            if (holds[col]) {
              ;(holds[col] as PartialHoldNotedataEntry).hold =
                beat - holds[col]!.beat
              holds[col] = undefined
            } else {
              console.log(
                "Extra end of hold/roll at beat " + beat + " col " + col
              )
            }
          }
          col++
        }
      }
    }
    return notedata
  }

  getStats(notedata: Notedata, timingData: TimingData): NotedataStats {
    const stats: NotedataStats = {
      npsGraph: this.getNPSPerMeasure(notedata, timingData),
      counts: {
        Taps: 0,
        Jumps: 0,
        Hands: 0,
        Holds: 0,
        Rolls: 0,
        Mines: 0,
        Fakes: 0,
        Lifts: 0,
      },
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
        if (cols > 1) stats.counts.Jumps++
        if (cols + holdCols > 2) stats.counts.Hands++
        cols = 0
        row = note.beat
      }
      if (note.type != "Mine" && !note.fake) cols++
      if (note.fake) {
        stats.counts.Fakes++
        continue
      }
      switch (note.type) {
        case "Tap":
          stats.counts.Taps++
          break
        case "Hold":
          stats.counts.Holds++
          break
        case "Roll":
          stats.counts.Rolls++
          break
        case "Lift":
          stats.counts.Lifts++
          break
        case "Mine":
          stats.counts.Mines++
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
    if (cols > 1) stats.counts.Jumps++
    if (cols + holdCols > 2) stats.counts.Hands++
    return stats
  }

  private getNPSPerMeasure(
    notedata: Notedata,
    timingData: TimingData
  ): number[] {
    const chartEnd = notedata[notedata.length - 1]?.beat ?? 0
    const nps = []
    let noteIndex = 0
    for (let beat = 0; beat < chartEnd; beat += 4) {
      const deltaTime =
        timingData.getSeconds(beat + 4) - timingData.getSeconds(beat)
      if (deltaTime <= 0.05) {
        nps.push(0)
        continue
      }
      let noteCount = 0
      while (notedata[noteIndex + 1] && notedata[noteIndex].beat < beat + 4) {
        const type = notedata[noteIndex].type
        noteIndex++
        if (
          !notedata[noteIndex].fake &&
          !notedata[noteIndex].warped &&
          (type == "Hold" || type == "Roll" || type == "Tap" || type == "Lift")
        )
          noteCount++
      }
      nps.push(noteCount / deltaTime)
    }
    return nps
  }
}
