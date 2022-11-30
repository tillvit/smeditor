import { Chart, CHART_DIFFICULTIES } from "./Chart.js";
import { TimingData, TIMING_PROPS } from "./TimingData.js";

const PROP_WHITELIST = [
  "TITLE", "SUBTITLE", "ARTIST",
  "TITLETRANSLIT", "SUBTITLETRANSLIT", "ARTISTTRANSLIT",
  "GENRE", "CREDIT", "ORIGIN", 
  "BACKGROUND", "BANNER", "MUSIC", "JACKET", "PREVIEW", "LYRICSPATH",
  "SAMPLESTART", "SAMPLELENGTH", "SELECTABLE", 

]

export async function parseSM(file) {
  let sm = await window.files.getFile(file).text()
  let type = file.split(".").pop()
  return new Simfile(sm, type)
}

export class Simfile {
  charts;
  _type;
  other_props;
  timingData;

  constructor(data, type) {
    this._type = type;
    this.timingData = new TimingData()
    this.other_props = {}
    //Remove Comments
    data = data.replaceAll(/\/\/.+/g, "")
    
    let props = [...data.matchAll(/#([A-Z]+):([^;]*);/g)]
    let ssc_pair = false
    let ssc_notedata = {}
    let temp_charts = []
    for (let prop of props) {
      if ((prop[1] == "NOTEDATA" && type == "ssc") || ssc_pair) {
        ssc_pair = true
        ssc_notedata[prop[1]] = prop[2]
        if (prop[1] == "NOTES") {
          temp_charts.push(ssc_notedata)
          ssc_notedata = {}, ssc_pair = false
        }
      }else if (prop[1] == "NOTES") {
        temp_charts.push(prop[2])
      }else{
        if (PROP_WHITELIST.includes(prop[1])) {
          this[prop[1]] = prop[2]
          if (prop[1] == "ATTACKS" || prop[1] == "BGCHANGES" || prop[1] == "FGCHANGES") {
            this[prop[1]] = prop[2].replaceAll(/[\s]/g,"").split(",")
            if (this[prop[1]].length == 1 && this[prop[1]][0] == "") {
              this[prop[1]] = []
            }
          }
        } else if (TIMING_PROPS.includes(prop[1])) {
          this.timingData.parse(prop[1],prop[2])
        }else{
          this.other_props[prop[1]] = prop[2]
        }
      }
    }

    this.timingData.reloadCache()
  
    this.charts = {}
   
    for (let data of temp_charts) {
      let chart = new Chart(data, type, this.timingData)
      if (chart == undefined) continue
      if (Object.keys(CHART_DIFFICULTIES).includes(chart.difficulty)) {
        if (!(chart.type in this.charts)) {
          this.charts[chart.type] = []
        }
        this.charts[chart.type].push(chart)
        this.charts[chart.type].sort((a,b)=>{
          if (CHART_DIFFICULTIES[a.difficulty] == CHART_DIFFICULTIES[b.difficulty]) return a.meter-b.meter
          return CHART_DIFFICULTIES[a.difficulty] - CHART_DIFFICULTIES[b.difficulty]
        })
      }else{
        console.log("Unknown chart difficulty " + chart.difficulty)
      }
    }
  }
}