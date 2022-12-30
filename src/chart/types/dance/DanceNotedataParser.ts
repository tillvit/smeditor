import { isHoldNote, Notedata, NotedataStats, PartialHoldNotedataEntry, PartialNotedata, PartialNotedataEntry } from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"
import { NotedataParser } from "../base/NotedataParser"

const NOTE_TYPE_LOOKUP: Record<string, string> = {
  "1": "Tap",
  "2": "Hold",
  "4": "Roll",
  "M": "Mine",
  "F": "Fake",
  "L": "Lift",
} 

export class DanceNotedataParser extends NotedataParser {
  
  fromString(data: string): PartialNotedata {
    let measures = data.split(",")
    let notedata: PartialNotedata = []
    let holds: (PartialNotedataEntry | undefined)[] = []
    for (let measure_num = 0; measure_num < measures.length; measure_num++) { 
      let rows = measures[measure_num].trim().split("\n")
      for (let row_index = 0; row_index < rows.length; row_index++) { 
        let row = rows[row_index].trim()
        let col = 0
        for (let c = 0; c < row.length; c++) { 
          let beat = measure_num*4 + row_index / rows.length * 4
          let type = row[c]
          if (type == "D" && row[c+1] == "L") { //why
            type = "3"
            c++
          }
          if (type != "0" && type != "3") {
            let entry = {
              beat: beat,
              col: col, 
              type: NOTE_TYPE_LOOKUP[type],
            } satisfies PartialNotedataEntry
            if (entry.type == undefined) {
              console.log("Unknown note type " + type + " at beat " + beat + " col " + col)
              continue
            } 
            if (type == "2" || type == "4") {
              if (holds[col]) {
                console.log("Missing end of hold/roll for note " + JSON.stringify(holds[col]))
              }
              holds[col] = entry
            }
            notedata.push(entry)
          }
          if (type == "3") {
            if (holds[col]) {
              (holds[col] as PartialHoldNotedataEntry).hold = beat - holds[col]!.beat
              holds[col] = undefined
            }else{
              console.log("Extra end of hold/roll at beat " + beat + " col " + col)
            }
          }
          col++
        }
      }
    }
    return notedata
  }

  getStats(notedata: Notedata, timingData: TimingData): NotedataStats {
    let stats: NotedataStats = {
      npsGraph: this.getNPSPerMeasure(notedata, timingData),
      counts: {
        taps: 0,
        jumps: 0,
        hands: 0,
        holds: 0,
        rolls: 0,
        mines: 0,
        fakes: 0,
        lifts: 0
      }
    }
    let row = -1
    let cols = 0
    let holdBeats: (number | undefined)[] = []
    for (let note of notedata) {
      if (note.beat != row) {
        let holdCols = 0
        for (let i = 0; i < holdBeats.length; i ++) {
          if (holdBeats[i]) {
            if (row > holdBeats[i]!) holdBeats[i] = undefined
            else if (holdBeats[i]! < note.beat) holdCols++
          }
        }
        if (cols > 1) stats.counts.jumps++
        if (cols + holdCols > 2) stats.counts.hands++
        cols = 0
        row = note.beat
      }
      if (note.type != "Mine" && !note.fake) cols++
      if (note.fake) {
        stats.counts.fakes++
        continue
      }
      switch (note.type) {
        case "Tap": stats.counts.taps++; break
        case "Hold": stats.counts.holds++; break
        case "Roll": stats.counts.rolls++; break
        case "Lift": stats.counts.lifts++; break
        case "Mine": stats.counts.mines++; break
      }
      if (isHoldNote(note)) {
        holdBeats[note.col] = note.beat + note.hold
      }
    }
    let holdCols = 0
    for (let i = 0; i < holdBeats.length; i ++) {
      if (holdBeats[i] && holdBeats[i]! < notedata[notedata.length - 1].beat) holdCols++
    }
    if (cols > 1) stats.counts.jumps++
    if (cols + holdCols > 2) stats.counts.hands++
    return stats
  }

  private getNPSPerMeasure(notedata: Notedata, timingData: TimingData): number[] {
    let chartEnd = notedata[notedata.length-1]?.beat ?? 0
    let nps = []
    let noteIndex = 0
    for (let beat = 0; beat < chartEnd; beat += 4) {
      let deltaTime = timingData.getSeconds(beat + 4) - timingData.getSeconds(beat)
      if (deltaTime <= 0.05) {
        nps.push(0)
        continue
      }
      let noteCount = 0
      while(notedata[noteIndex+1] && notedata[noteIndex].beat < beat + 4) {
        let type = notedata[noteIndex].type
        noteIndex++
        if (!notedata[noteIndex].fake && !notedata[noteIndex].warped && (type == "Hold" || type == "Roll" || type == "Tap" || type == "Lift"))
        noteCount++
      }
      nps.push(noteCount/deltaTime)
    }
    return nps
  }
}