import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { getErrorMessage } from "../../util/Util"
import { Chart } from "./Chart"
import { CHART_DIFFICULTIES } from "./ChartTypes"
import { SIMFILE_PROPERTIES, SimfileProperty } from "./SimfileTypes"
import { TimingData } from "./TimingData"
import {
  TIMING_EVENT_NAMES,
  TimingEventProperty,
  TimingProperty,
} from "./TimingTypes"

export class Simfile {
  charts: Record<string, Chart[]> = {}
  _type?: "sm" | "ssc"
  other_properties: { [key: string]: string } = {}
  properties: { [key in SimfileProperty]?: string } = {}
  timingData: TimingData = new TimingData()

  unloadedCharts: (string | { [key: string]: string })[] = []

  loaded: Promise<void>

  constructor(file: File) {
    this.loaded = new Promise(resolve => {
      const type = file.name.split(".").pop()
      if (type == "sm" || type == "ssc") this._type = type
      else resolve()

      file.text().then(data => {
        //Remove Comments
        data = data.replaceAll(/\/\/.+/g, "")

        const props = [...data.matchAll(/#([A-Z]+):([^;]*);/g)]
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
              TIMING_EVENT_NAMES.includes(prop[1] as TimingEventProperty)
            ) {
              this.timingData.parse(prop[1] as TimingProperty, prop[2])
            } else {
              this.other_properties[prop[1]] = prop[2]
            }
          }
        }

        this.timingData.reloadCache()

        this.charts = {}

        for (const data of temp_charts) {
          let chart
          try {
            chart = new Chart(this, data)
          } catch (error) {
            this.unloadedCharts.push(data)
            WaterfallManager.createFormatted(getErrorMessage(error), "warn")
            continue
          }
          this.addChart(chart)
        }
        resolve()
      })
    })
  }

  addChart(chart: Chart) {
    this.charts[chart.gameType.id] ||= []
    this.charts[chart.gameType.id]!.push(chart)
    this.charts[chart.gameType.id]!.sort((a, b) => {
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

  removeChart(chart: Chart): boolean {
    if (!this.charts[chart.gameType.id]) return false
    const i = this.charts[chart.gameType.id].indexOf(chart)
    if (i == -1) return false
    this.charts[chart.gameType.id].splice(i, 1)
    return true
  }

  serialize(type: "sm" | "ssc"): string {
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
      str += this.formatProperty("BANNER", this.properties.GENRE)
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
    for (const gameType in this.charts) {
      for (const chart of this.charts[gameType]) {
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

  usesSplitTiming(): boolean {
    for (const type in this.charts) {
      for (const chart of this.charts[type]) {
        if (!chart.timingData.isEmpty()) return true
      }
    }
    return false
  }

  requiresSSC(): boolean {
    if (this.timingData.requiresSSC()) return true
    if (this.usesSplitTiming()) return true
    for (const type in this.charts) {
      for (const chart of this.charts[type]) {
        if (chart.requiresSSC()) return true
      }
    }
    return false
  }

  private formatProperty(name: string, item: string | number | undefined) {
    item ||= ""
    return "#" + name.toUpperCase() + ":" + item + ";\n"
  }
}
