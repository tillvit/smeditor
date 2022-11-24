import { TimingData, TIMING_PROPS } from "./TimingData.js";

export const CHART_DIFFICULTIES = {
  "Beginner": 0,
  "Easy": 1,
  "Medium": 2,
  "Hard": 3,
  "Challenge": 4,
  "Edit": 5
}

export const NOTE_TYPES = {
  "1": "Tap",
  "2": "Hold",
  "4": "Roll",
  "M": "Mine",
}

export class Chart {
  type;
  description;
  difficulty;
  meter;
  radarValues = [];
  chartName;
  chartStyle;
  credit;
  timingData;
  notedata;

  constructor(data, type, fallbackTimingData) {
    this.timingData = new TimingData(fallbackTimingData)
    if (type == "ssc") {
      for (let prop in data) {
        if (TIMING_PROPS.includes(prop)) this.timingData.parse(prop,data[prop])
      }
      this.timingData.reloadCache()
      this.type = data["STEPSTYPE"] ?? ""
      this.description = data["DESCRIPTION"] ?? ""
      this.difficulty = data["DIFFICULTY"] ?? ""
      this.meter = parseInt(data["METER"]) ?? ""
      this.radarValues = data["RADARVALUES"] ?? ""
      console.log("Loading chart " + this.difficulty + " " + this.meter + " " + this.type)
      this.notedata = this.parseNotedata(data["NOTES"]) ?? {}
      this.credit = data["CREDIT"] ?? ""
      this.chartName = data["CHARTNAME"] ?? ""
      this.chartStyle= data["CHARTSTYLE"] ?? ""
    }else if (type == "sm") {
      let match = /([\w\d\-]+):[\s ]*([\w\d\- \'\"?.]*):[\s ]*([\w\d\-]+):[\s ]*([\d]+):[\s ]*([\d.,]+):[\s ]*([\w\d\s, ]+)/g.exec(data.trim())
      if (match != null) {
        this.type = match[1] ?? ""
        this.description = match[2] ?? ""
        this.difficulty = match[3] ?? ""
        this.meter = parseInt(match[4]) ?? ""
        this.radarValues = match[5] ?? ""
        this.notedata = this.parseNotedata(match[6]) ?? {}
        this.credit = ""
        this.chartName = ""
        this.chartStyle = ""
      }
    }
  }

  parseNotedata(str) {
    let measures = str.split(",")
    let notedata = []
    let holds = [null, null, null, null]
    for (let measure_num = 0; measure_num < measures.length; measure_num++) { 
      let rows = measures[measure_num].trim().split("\n")
      for (let row_index = 0; row_index < rows.length; row_index++) { 
        let row = rows[row_index].trim()
        for (let col = 0; col < row.length; col++) { 
          let beat = measure_num*4 + row_index / rows.length * 4
          if (row[col] != "0" && row[col] != "3") {
            let item = {
              beat: beat,
              col: col, 
              type: NOTE_TYPES[row[col]],
              warped: this.timingData.isBeatWarped(beat),
              fake: this.timingData.isBeatFaked(beat),
              second: this.timingData.getSeconds(beat)
            }
            if (item.type == undefined) {
              console.log("Unknown note type " + row[col] + " at beat " + beat + " col " + col)
              continue
            } 
            if (row[col] == "2" || row[col] == "4") {
              if (holds[col] != null) {
                console.log("Missing end of hold/roll for note " + holds[col])
              }
              holds[col] = item
            }
            notedata.push(item)
          }
          if (row[col] == "3") {
            if (holds[col] == null) {
              console.log("Extra end of hold/roll at beat " + beat + " col " + col)
            }else{
              holds[col].hold = beat - holds[col].beat
              holds[col] = null
            }
          }
        }
      }
    }
    return notedata
  }

  getSeconds(beat) {
    return this.timingData.getSeconds(beat)
  }

  getBeat(seconds) {
    return this.timingData.getBeat(seconds)
  }

  isBeatWarped(beat) {
    return this.timingData.isBeatWarped(beat)
  }

  isBeatFaked(beat) {
    return this.timingData.isBeatFaked(beat)
  }
  
} 