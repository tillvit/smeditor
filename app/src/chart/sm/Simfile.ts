import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { Chart } from "./Chart"
import { CHART_DIFFICULTIES } from "./ChartTypes"
import { SIMFILE_PROPERTIES, SimfileProperty } from "./SimfileTypes"
import { loadSMEData } from "./SMEParser"
import { SongTimingData } from "./SongTimingData"
import { TIMING_EVENT_NAMES, TimingEventType, TimingType } from "./TimingTypes"

export class Simfile {
  charts: Record<string, Chart> = {}
  _type?: "sm" | "ssc"
  other_properties: { [key: string]: string } = {}
  properties: { [key in SimfileProperty]?: string } = {}
  timingData: SongTimingData = new SongTimingData(this)

  unloadedCharts: (string | { [key: string]: string })[] = []

  loaded: Promise<void>

  constructor(file: File, dataFile?: File) {
    this.loaded = new Promise(resolve => {
      let type = file.name.split(".").pop()
      const isAutosave = type == "smebak"
      if (type == "smebak") type = "ssc"
      if (type == "sm" || type == "ssc") this._type = type
      else resolve()

      const run = async () => {
        let smData = await file.text()

        // Remove comments
        smData = smData.replaceAll(/\/\/.+/g, "")

        const props = [...smData.matchAll(/#([A-Z]+):([^;]*);/g)]
        let ssc_pair = false
        let ssc_notedata: { [key: string]: string } = {}
        const temp_charts = []
        for (const prop of props) {
          if ((prop[1] == "NOTEDATA" && type == "ssc") || ssc_pair) {
            ssc_pair = true
            ssc_notedata[prop[1]] = prop[2]
            if (prop[1] == "NOTES") {
              temp_charts.push(ssc_notedata)
              ssc_notedata = {}
              ssc_pair = false
            }
          } else if (prop[1] == "NOTES") {
            temp_charts.push(prop[2])
          } else {
            if (SIMFILE_PROPERTIES.includes(prop[1] as SimfileProperty)) {
              this.properties[prop[1] as SimfileProperty] = prop[2]
            } else if (
              prop[1] == "OFFSET" ||
              TIMING_EVENT_NAMES.includes(prop[1] as TimingEventType)
            ) {
              this.timingData.parse(prop[1] as TimingType, prop[2])
            } else {
              this.other_properties[prop[1]] = prop[2]
            }
          }
        }

        this.charts = {}

        for (const data of temp_charts) {
          let chart
          try {
            chart = new Chart(this, data)
          } catch (error) {
            this.unloadedCharts.push(data)
            WaterfallManager.createFormatted(error as Error, "warn")
            continue
          }
          this.addChart(chart)
        }

        if (dataFile) {
          const dataText = await dataFile.text()
          loadSMEData(dataText, this, isAutosave)
        }

        this.timingData.reloadCache()
        resolve()
      }
      run()
    })
  }

  addChart(chart: Chart) {
    const id = this.createChartID()
    this.charts[id] = chart
    chart._id = id
  }

  private createChartID(): string {
    let id = Math.random().toString(36).substring(2, 9)
    while (this.charts[id]) {
      id = Math.random().toString(36).substring(2, 9)
    }
    return id
  }

  removeChart(chart: Chart): boolean {
    if (!chart._id) return false
    if (!this.charts[chart._id]) return false
    delete this.charts[chart._id]
    return true
  }

  getChartsByGameType(gameType: string) {
    return Object.values(this.charts)
      .filter(c => c.gameType.id == gameType)
      .sort((a, b) => {
        if (
          CHART_DIFFICULTIES.indexOf(a.difficulty) ==
          CHART_DIFFICULTIES.indexOf(b.difficulty)
        )
          return a.meter - b.meter
        return (
          CHART_DIFFICULTIES.indexOf(a.difficulty) -
          CHART_DIFFICULTIES.indexOf(b.difficulty)
        )
      })
  }

  getAllChartsByGameType() {
    const charts: Record<string, Chart[]> = {}
    for (const chart of Object.values(this.charts)) {
      if (!charts[chart.gameType.id]) charts[chart.gameType.id] = []
      charts[chart.gameType.id].push(chart)
    }
    return charts
  }

  serialize(type: "sm" | "ssc" | "smebak"): string {
    let str = ""
    if (type == "sm") {
      if (this.other_properties["NITGVERSION"])
        str += this.formatProperty(
          "NITGVERSION",
          this.other_properties["NITGVERSION"]
        )
      str += this.formatProperty("TITLE", this.properties.TITLE)
      str += this.formatProperty("SUBTITLE", this.properties.SUBTITLE)
      str += this.formatProperty("ARTIST", this.properties.ARTIST)
      str += this.formatProperty("MUSIC", this.properties.MUSIC ?? "")
      str += this.formatProperty("BANNER", this.properties.BANNER)
      str += this.formatProperty("BACKGROUND", this.properties.BACKGROUND)
      str += this.formatProperty("LYRICSPATH", this.properties.LYRICSPATH)
      str += this.formatProperty("CDTITLE", this.properties.CDTITLE)
      str += this.formatProperty("SAMPLESTART", this.properties.SAMPLESTART)
      str += this.formatProperty("SAMPLELENGTH", this.properties.SAMPLELENGTH)
    } else {
      str += this.formatProperty(
        "VERSION",
        this.other_properties["VERSION"] ?? 0.83
      )
      str += this.formatProperty("TITLE", this.properties.TITLE)
      str += this.formatProperty("SUBTITLE", this.properties.SUBTITLE)
      str += this.formatProperty("ARTIST", this.properties.ARTIST)
      str += this.formatProperty("TITLETRANSLIT", this.properties.TITLETRANSLIT)
      str += this.formatProperty(
        "SUBTITLETRANSLIT",
        this.properties.SUBTITLETRANSLIT
      )
      str += this.formatProperty(
        "ARTISTTRANSLIT",
        this.properties.ARTISTTRANSLIT
      )
      str += this.formatProperty("GENRE", this.properties.GENRE)
      str += this.formatProperty("CREDIT", this.properties.CREDIT)
      str += this.formatProperty("MUSIC", this.properties.MUSIC ?? "")
      str += this.formatProperty("BANNER", this.properties.BANNER)
      str += this.formatProperty("BACKGROUND", this.properties.BACKGROUND)
      str += this.formatProperty("JACKET", this.properties.JACKET)
      str += this.formatProperty("DISCIMAGE", this.properties.DISCIMAGE)
      str += this.formatProperty("CDIMAGE", this.properties.CDIMAGE)
      str += this.formatProperty(
        "SELECTABLE",
        this.properties.SELECTABLE ?? "YES"
      )
      str += this.formatProperty("LYRICSPATH", this.properties.LYRICSPATH)
      str += this.formatProperty("CDTITLE", this.properties.CDTITLE)
      str += this.formatProperty("SAMPLESTART", this.properties.SAMPLESTART)
      str += this.formatProperty("SAMPLELENGTH", this.properties.SAMPLELENGTH)
    }
    str += this.timingData.serialize(type)
    for (const prop in this.other_properties) {
      if (prop == "VERSION" || prop == "NITGVERSION") continue
      str += this.formatProperty(prop, this.other_properties[prop])
    }
    str += "\n"
    const charts = this.getAllChartsByGameType()
    for (const gameType in charts) {
      for (const chart of charts[gameType]) {
        str += chart.serialize(type) + "\n"
      }
    }
    for (const chart of this.unloadedCharts) {
      if (typeof chart == "string") {
        str += "#NOTES:" + chart + "\n"
      } else {
        str +=
          "//---------------" +
          chart.STEPSTYPE +
          " - " +
          chart.DESCRIPTION +
          "---------------\n"
        str += "#NOTEDATA:;\n"
        str += `#CHARTNAME:${chart.CHARTNAME};\n`
        str += `#CHARTSTYLE:${chart.CHARTSTYLE};\n`
        str += `#CREDIT:${chart.CREDIT};\n`
        if (chart.MUSIC) str += `#MUSIC:${chart.MUSIC};\n`
        str += `#STEPSTYPE:${chart.STEPSTYPE};\n`
        str += `#DESCRIPTION:${chart.DESCRIPTION};\n`
        str += `#DIFFICULTY:${chart.DIFFICULTY};\n`
        str += `#METER:${chart.METER};\n`
        str += `#METERF:${chart.METERF ?? chart.METER};\n`
        str += `#RADARVALUES:${chart.RADARVALUES};\n`
        str += `#NOTES:`
        for (const prop in chart) {
          if (
            [
              "NOTEDATA",
              "CHARTNAME",
              "CHARTSTYLE",
              "CREDIT",
              "MUSIC",
              "STEPSTYPE",
              "DESCRIPTION",
              "DIFFICULTY",
              "METER",
              "METERF",
              "RADARVALUES",
            ].includes(prop)
          )
            continue
          str += `#${prop}:${chart[prop]};\n\n`
        }
      }
    }
    return str
  }

  usesChartTiming(): boolean {
    for (const chart of Object.values(this.charts)) {
      if (chart.timingData.usesChartTiming()) return true
    }
    return false
  }

  requiresSSC(): boolean {
    if (this.timingData.requiresSSC()) return true
    if (this.usesChartTiming()) return true
    for (const chart of Object.values(this.charts)) {
      if (chart.requiresSSC()) return true
    }
    return false
  }

  recalculateAllStats() {
    for (const chart of Object.values(this.charts)) {
      chart.recalculateStats()
    }
  }

  private formatProperty(name: string, item: string | number | undefined) {
    item ||= ""
    return "#" + name.toUpperCase() + ":" + item + ";\n"
  }

  destroy() {
    Object.values(this.charts).forEach(chart => {
      chart.destroy()
    })
  }
}
