import { Chart } from "./Chart";
import { CHART_DIFFICULTIES } from "./ChartTypes"
import { StepsType, SimfileProperty, SIMFILE_PROPERTIES } from "./SimfileTypes"
import { TimingData } from "./TimingData";
import { TimingEventProperty, TimingProperty, TIMING_EVENT_NAMES } from "./TimingTypes"



export class Simfile {
  charts: {[key in StepsType]?: Chart[]} = {};
  _type?: "sm"|"ssc";
  other_properties : {[key: string]: string} = {};
  properties: {[key in SimfileProperty]?: string} = {}
  timingData: TimingData = new TimingData();

  loaded: Promise<void>

  constructor(file: File) {
    this.loaded = new Promise(resolve => {
      let type = file.name.split(".").pop()
      if (type == "sm" || type == "ssc") this._type = type;
      else resolve()
      
      file.text().then(data => {
        //Remove Comments
        data = data.replaceAll(/\/\/.+/g, "")
        
        let props = [...data.matchAll(/#([A-Z]+):([^;]*);/g)]
        let ssc_pair = false
        let ssc_notedata: {[key: string]: string} = {}
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
            if (SIMFILE_PROPERTIES.includes(prop[1] as SimfileProperty)) {
              this.properties[prop[1] as SimfileProperty] = prop[2]
            } else if (prop[1] == "OFFSET" || TIMING_EVENT_NAMES.includes(prop[1] as TimingEventProperty)) {
              this.timingData.parse(prop[1] as TimingProperty,prop[2])
            }else{
              this.other_properties[prop[1]] = prop[2]
            }
          }
        }
  
        this.timingData.reloadCache()
      
        this.charts = {}
      
        for (let data of temp_charts) {
          let chart
          try {
            chart = new Chart(data, type as "sm"|"ssc", this.timingData)
          } catch(error) {
            console.warn(error)
            continue
          }
          this.charts[chart.type] ||= []
          this.charts[chart.type]!.push(chart)
          this.charts[chart.type]!.sort((a, b)=>{
            if (CHART_DIFFICULTIES.indexOf(a.difficulty) == CHART_DIFFICULTIES.indexOf(b.difficulty)) return a.meter-b.meter
            return CHART_DIFFICULTIES.indexOf(a.difficulty) - CHART_DIFFICULTIES.indexOf(b.difficulty)
          })
        }
        resolve()
      })
    }) 
  }
}