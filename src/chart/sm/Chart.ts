import { ChartDifficulty, CHART_DIFFICULTIES } from "./ChartTypes"
import { Notedata, NotedataEntry, NOTE_TYPE_LOOKUP } from "./NoteTypes"
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


  constructor(data: string | {[key: string]: string}, type: "sm"|"ssc", fallbackTimingData: TimingData) {
    this.timingData = new TimingData(fallbackTimingData)
    if (type == "ssc") {
      let dict = data as {[key: string]: string}
      for (let property in dict) {
        if (property == "OFFSET" || TIMING_EVENT_NAMES.includes(property as TimingEventProperty)) this.timingData.parse(property as TimingProperty, dict[property])
      }
      this.timingData.reloadCache()
      if (STEPS_TYPES.includes(dict["STEPSTYPE"] as StepsType)) this.type = dict["STEPSTYPE"] as StepsType
      else console.log("Unknown step type " + dict["STEPSTYPE"])
      this.description = dict["DESCRIPTION"] ?? ""
      if (CHART_DIFFICULTIES.includes(dict["STEPSTYPE"] as ChartDifficulty)) this.difficulty = dict["DIFFICULTY"] as ChartDifficulty
      else console.log("Unknown chart difficulty " + dict["DIFFICULTY"])
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
        else console.log("Unknown step type " + match[1])
        this.description = match[2] ?? ""
        if (CHART_DIFFICULTIES.includes(match[3] as ChartDifficulty)) this.difficulty = match[3] as ChartDifficulty
        else console.log("Unknown chart difficulty " + match[3])
        this.meter = parseInt(match[4]) ?? 0
        this.radarValues = match[5] ?? ""
        this.notedata = this.parseNotedata(match[6]) ?? []
      }else{
        console.log("Failed to load sm chart!")
        return
      }
    }
    console.log("Loading chart " + this.difficulty + " " + this.meter + " " + this.type)
  }

  parseNotedata(data: string): Notedata {
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
              fake: this.timingData.isBeatFaked(beat),
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
  
} 