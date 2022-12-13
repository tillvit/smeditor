import { bsearch } from "../../util/Util"
import { ChartDifficulty, CHART_DIFFICULTIES } from "./ChartTypes"
import { Notedata, NotedataCount, NotedataEntry, NoteType, NOTE_TYPE_LOOKUP } from "./NoteTypes"
import { StepsType, STEPS_TYPES } from "./SimfileTypes"
import { TimingData } from "./TimingData";
import { TimingEventProperty, TimingProperty, TIMING_EVENT_NAMES } from "./TimingTypes"

export class Chart {
  type: StepsType = "dance-single"
  description: string = ""
  difficulty: ChartDifficulty = "Beginner";
  meter: number = 0
  radarValues: string = ""
  chartName: string = ""
  chartStyle: string = ""
  credit: string = ""
  timingData: TimingData

  notedata: Notedata = [];
  private _notedataCount?: NotedataCount


  constructor(data: string | {[key: string]: string}, type: "sm"|"ssc", fallbackTimingData: TimingData) {
    this.timingData = new TimingData(fallbackTimingData)
    if (type == "ssc") {
      let dict = data as {[key: string]: string}
      for (let property in dict) {
        if (property == "OFFSET" || TIMING_EVENT_NAMES.includes(property as TimingEventProperty)) this.timingData.parse(property as TimingProperty, dict[property])
      }
      this.timingData.reloadCache()
      if (STEPS_TYPES.includes(dict["STEPSTYPE"] as StepsType)) this.type = dict["STEPSTYPE"] as StepsType
      else throw Error("Unknown step type " + dict["STEPSTYPE"])
      this.description = dict["DESCRIPTION"] ?? ""
      if (CHART_DIFFICULTIES.includes(dict["DIFFICULTY"] as ChartDifficulty)) this.difficulty = dict["DIFFICULTY"] as ChartDifficulty
      else throw Error("Unknown chart difficulty " + dict["DIFFICULTY"])
      this.meter = parseInt(dict["METER"]) ?? 0
      this.radarValues = dict["RADARVALUES"] ?? ""
      this.notedata = this.parseNotedata(dict["NOTES"]) ?? []
      this.credit = dict["CREDIT"] ?? ""
      this.chartName = dict["CHARTNAME"] ?? ""
      this.chartStyle= dict["CHARTSTYLE"] ?? ""
    }else{
      let match = /([\w\d\-]+):[\s ]*([^:]*):[\s ]*([\w\d]+):[\s ]*([\d]+):[\s ]*([\d.,]+):[\s ]*([\w\d\s, ]+)/g.exec((<string>data).trim())
      if (match != null) {
        if (STEPS_TYPES.includes(match[1] as StepsType)) this.type = match[1] as StepsType
        else throw Error("Unknown step type " + match[1])
        this.description = match[2] ?? ""
        if (CHART_DIFFICULTIES.includes(match[3] as ChartDifficulty)) this.difficulty = match[3] as ChartDifficulty
        else throw Error("Unknown chart difficulty " + match[3])
        this.meter = parseInt(match[4]) ?? 0
        this.radarValues = match[5] ?? ""
        this.notedata = this.parseNotedata(match[6]) ?? []
      }else{
        throw Error("Failed to load sm chart!")
      }
    }
    this._notedataCount = this.countNotes()
    console.log("Loading chart " + this.difficulty + " " + this.meter + " " + this.type)
  }

  private parseNotedata(data: string): Notedata {
    let measures = data.split(",")
    let notedata: Notedata = []
    let holds: (NotedataEntry | undefined)[] = [undefined, undefined, undefined, undefined]
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
            let entry: NotedataEntry = {
              beat: beat,
              col: col, 
              type: NOTE_TYPE_LOOKUP[type],
              warped: this.timingData.isBeatWarped(beat),
              fake: NOTE_TYPE_LOOKUP[type] == "Fake" || this.timingData.isBeatFaked(beat),
              second: this.timingData.getSeconds(beat)
            }
            if (entry.type == undefined) {
              console.log("Unknown note type " + type + " at beat " + beat + " col " + col)
              continue
            } 
            if (type == "2" || type == "4") {
              if (holds[col] != null) {
                console.log("Missing end of hold/roll for note " + JSON.stringify(holds[col]))
              }
              holds[col] = entry
            }
            notedata.push(entry)
          }
          if (type == "3") {
            if (holds[col] == undefined) {
              console.log("Extra end of hold/roll at beat " + beat + " col " + col)
            }else{
              holds[col]!.hold = beat - holds[col]!.beat
              holds[col] = undefined
            }
          }
          col++
        }
      }
    }
    return notedata
  }

  getNoteCounts() {
    return this._notedataCount!
  }

  private countNotes(): NotedataCount {
    let count: NotedataCount = {
      peakNps: 0,
      taps: 0,
      jumps: 0,
      hands: 0,
      holds: 0,
      rolls: 0,
      mines: 0,
      fakes: 0,
      lifts: 0
    }
    let row = -1
    let cols = 0
    let holdBeats: (number | undefined)[] = [undefined, undefined, undefined, undefined]
    for (let entry of this.notedata) {
      if (entry.beat != row) {
        let holdCols = 0
        for (let i = 0; i < holdBeats.length; i ++) {
          if (holdBeats[i]) {
            if (row > holdBeats[i]!) holdBeats[i] = undefined
            else if (holdBeats[i]! < entry.beat) holdCols++
          }
        }
        if (cols > 1) count.jumps++
        if (cols + holdCols > 2) count.hands++
        cols = 0
        row = entry.beat
      }
      if (entry.type != "Mine" && !entry.fake) cols++
      if (entry.fake) {
        count.fakes++
        continue
      }
      switch (entry.type) {
        case "Tap": count.taps++; break
        case "Hold": count.holds++; break
        case "Roll": count.rolls++; break
        case "Lift": count.lifts++; break
        case "Mine": count.mines++; break
      }
      if (entry.hold) {
        holdBeats[entry.col] = entry.beat + entry.hold
      }
    }
    let holdCols = 0
    for (let i = 0; i < holdBeats.length; i ++) {
      if (holdBeats[i] && holdBeats[i]! < this.notedata[this.notedata.length - 1].beat) holdCols++
    }
    if (cols > 1) count.jumps++
    if (cols + holdCols > 2) count.hands++
    return count
  }

  getNPSPerMeasure(): number[] {
    let chartEnd = this.notedata[this.notedata.length-1]?.beat ?? 0
    let nps = []
    let noteIndex = 0
    for (let beat = 0; beat < chartEnd; beat += 4) {
      let deltaTime = this.getSeconds(beat + 4) - this.getSeconds(beat)
      if (deltaTime <= 0.05) {
        nps.push(0)
        continue
      }
      let noteCount = 0
      while(this.notedata[noteIndex] && this.notedata[noteIndex].beat < beat + 4) {
        noteIndex++
        noteCount++
      }
      nps.push(noteCount/deltaTime)
    }
    return nps
  }

  getSeconds(beat: number): number {
    return this.timingData.getSeconds(beat)
  }

  getBeat(seconds: number): number {
    return this.timingData.getBeat(seconds)
  }

  isBeatWarped(beat: number): boolean {
    return this.timingData.isBeatWarped(beat)
  }

  isBeatFaked(beat: number): boolean {
    return this.timingData.isBeatFaked(beat)
  }

  addNote(note: {beat: number, col: number, type: "Tap"|"Mine"|"Fake"|"Lift"}): NotedataEntry
  addNote(note: {beat: number, col: number, type: "Hold"|"Roll", hold: number}): NotedataEntry
  addNote(note: {beat: number, col: number, type: NoteType, hold?: number}): NotedataEntry {
    note.beat = Math.round(note.beat*192)/192
    if (note.hold) note.hold = Math.round(note.hold*192)/192
    let computedNote: NotedataEntry = {
      beat: note.beat,
      col: note.col,
      type: note.type,
      warped: this.timingData.isBeatWarped(note.beat),
      fake: note.type == "Fake" || this.timingData.isBeatFaked(note.beat),
      second: this.timingData.getSeconds(note.beat),
      hold: note.hold
    }
    let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
    if (index >= 1 && this.notedata[index-1].beat > note.beat) index--
    this.notedata.splice(index, 0, computedNote)
    this.countNotes()
    return computedNote
  }

  modifyNote(note: NotedataEntry, properties: Partial<NotedataEntry>) {
    Object.assign(note, properties)
    this.notedata.splice(this.notedata.indexOf(note), 1)
    let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
    if (index >= 1 && this.notedata[index-1].beat > note.beat) index--
    this.notedata.splice(index, 0, note)
    this.countNotes()
  }

  removeNote(note: NotedataEntry) {
    this.notedata.splice(this.notedata.indexOf(note), 1)
    this.countNotes()
  }
  
} 